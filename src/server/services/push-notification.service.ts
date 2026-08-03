import "server-only";

import type { PushSubscription } from "@prisma/client";
import webPush from "web-push";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import {
  buildPushPayloadFromNotification,
  getPushPreferenceKey,
  shouldDeletePushSubscription
} from "@/lib/push-payload";
import type { AppNotification, NotificationType } from "@/types/notification.types";
import type { PushNotificationPayload } from "@/types/push.types";

const vapidConfigSchema = z.object({
  publicKey: z.string().min(20),
  privateKey: z.string().min(20),
  subject: z.string().refine((value) => value.startsWith("mailto:") || value.startsWith("https://"))
});

type DeliveryResult = {
  subscriptionId: string;
  endpoint: string;
  ok: boolean;
  stale: boolean;
  statusCode?: number;
};

type PushDeliverySummary = {
  found: number;
  attempted: number;
  sent: number;
  failed: number;
  stale: number;
  results: Array<{ success: boolean; statusCode?: number }>;
};

type SendPushToUserInput = {
  userId: string;
  notificationType?: NotificationType;
  payload: PushNotificationPayload | ((locale: Locale) => PushNotificationPayload);
};

let configuredFingerprint: string | null = null;

export function isWebPushEnabled() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_ENABLED === "true";
}

export function isWebPushConfigured() {
  return isWebPushEnabled() && getVapidConfig().success;
}

export function buildPushPayload(notification: AppNotification, locale: Locale = "az") {
  return buildPushPayloadFromNotification(notification, locale);
}

export async function sendPushForNotification(recipientId: string, notification: AppNotification) {
  return sendPushToUser({
    userId: recipientId,
    notificationType: notification.type,
    payload: (locale) => buildPushPayload(notification, locale)
  });
}

export async function sendPushToUser(input: SendPushToUserInput) {
  if (!isWebPushEnabled() || !input.userId) {
    return emptyDeliverySummary();
  }

  try {
    if (!configureWebPush()) {
      return emptyDeliverySummary();
    }

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        locale: true,
        pushNotificationsEnabled: true,
        pushDirectMessages: true,
        pushFriendRequests: true,
        pushClubNotifications: true,
        pushMatchNotifications: true,
        pushSubscriptions: true
      }
    });

    if (!user?.pushNotificationsEnabled) {
      return emptyDeliverySummary(user?.pushSubscriptions.length ?? 0);
    }

    if (input.notificationType && !user[getPushPreferenceKey(input.notificationType)]) {
      return emptyDeliverySummary(user.pushSubscriptions.length);
    }

    const payload = typeof input.payload === "function" ? input.payload(user.locale.toLowerCase() as Locale) : input.payload;
    const settled = await Promise.allSettled(
      user.pushSubscriptions.map((subscription) =>
        sendPushToSubscription(subscription, payload, {
          userId: input.userId,
          notificationType: input.notificationType ?? payload.type ?? "PUSH_TEST"
        })
      )
    );
    const results = settled.map((result, index): DeliveryResult =>
      result.status === "fulfilled"
        ? result.value
        : {
            subscriptionId: user.pushSubscriptions[index].id,
            endpoint: user.pushSubscriptions[index].endpoint,
            ok: false,
            stale: false
          }
    );
    const staleIds = results.filter((result) => result.stale).map((result) => result.subscriptionId);
    const successfulIds = results.filter((result) => result.ok).map((result) => result.subscriptionId);

    await Promise.allSettled([
      staleIds.length ? prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds }, userId: input.userId } }) : Promise.resolve(),
      successfulIds.length ? prisma.pushSubscription.updateMany({ where: { id: { in: successfulIds }, userId: input.userId }, data: { lastUsedAt: new Date() } }) : Promise.resolve()
    ]);

    const sent = results.filter((result) => result.ok).length;
    const failed = results.length - sent;
    console.info("[web-push] delivery summary", {
      userId: input.userId,
      notificationType: input.notificationType ?? payload.type ?? "PUSH_TEST",
      subscriptions: results.length,
      sent,
      failed,
      stale: results.filter((result) => result.stale).map((result) => maskEndpoint(result.endpoint))
    });

    return {
      found: results.length,
      attempted: results.length,
      sent,
      failed,
      stale: staleIds.length,
      results: results.map((result) => ({
        success: result.ok,
        ...(typeof result.statusCode === "number" ? { statusCode: result.statusCode } : {})
      }))
    } satisfies PushDeliverySummary;
  } catch (error) {
    console.error("[web-push] user delivery failed", {
      userId: input.userId,
      notificationType: input.notificationType ?? "PUSH_TEST",
      error: toSafeErrorMessage(error)
    });
    return { ...emptyDeliverySummary(), failed: 1 };
  }
}

export async function sendPushToSubscription(
  subscription: Pick<PushSubscription, "id" | "endpoint" | "p256dh" | "auth">,
  payload: PushNotificationPayload,
  context: { userId: string; notificationType: NotificationType | "PUSH_TEST" }
): Promise<DeliveryResult> {
  try {
    const response = await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24, urgency: context.notificationType === "MESSAGE" || context.notificationType === "DIRECT_MESSAGE" ? "high" : "normal" }
    );
    return {
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      ok: true,
      stale: false,
      statusCode: response.statusCode
    };
  } catch (error) {
    const statusCode = getStatusCode(error);
    const stale = shouldDeletePushSubscription(statusCode);
    console.warn("[web-push] subscription delivery failed", {
      userId: context.userId,
      notificationType: context.notificationType,
      subscription: maskEndpoint(subscription.endpoint),
      statusCode,
      stale,
      error: toSafeErrorMessage(error)
    });
    return { subscriptionId: subscription.id, endpoint: subscription.endpoint, ok: false, stale, statusCode };
  }
}

function emptyDeliverySummary(found = 0): PushDeliverySummary {
  return { found, attempted: 0, sent: 0, failed: 0, stale: 0, results: [] };
}

function configureWebPush() {
  const parsed = getVapidConfig();
  if (!parsed.success) {
    console.error("[web-push] enabled but VAPID configuration is invalid");
    return false;
  }

  const fingerprint = `${parsed.data.subject}:${parsed.data.publicKey}`;
  if (configuredFingerprint !== fingerprint) {
    webPush.setVapidDetails(parsed.data.subject, parsed.data.publicKey, parsed.data.privateKey);
    configuredFingerprint = fingerprint;
  }
  return true;
}

function getVapidConfig() {
  return vapidConfigSchema.safeParse({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
  });
}

function getStatusCode(error: unknown) {
  if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}

function maskEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return `${url.origin}/…${url.pathname.slice(-8)}`;
  } catch {
    return "invalid-endpoint";
  }
}

function toSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 200) : "Unknown push error";
}
