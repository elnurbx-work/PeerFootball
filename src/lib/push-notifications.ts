"use client";

import type { PushClientStatus, PushSubscriptionInput } from "@/types/push.types";
import { getPeerFootballServiceWorkerRegistration } from "@/lib/service-worker";

export const webPushFeatureEnabled = process.env.NEXT_PUBLIC_WEB_PUSH_ENABLED === "true";

export function isPushSupported() {
  return webPushFeatureEnabled
    && typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator
    && "PushManager" in window;
}

export function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = globalThis.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null;
  const registration = await getPeerFootballServiceWorkerRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(callbacks: {
  onPermissionRequest?: () => void;
  onSubscribing?: () => void;
} = {}) {
  if (!webPushFeatureEnabled) throw new Error("disabled");
  if (!isPushSupported()) throw new Error("unsupported");
  if (Notification.permission === "denied") throw new Error("permission-denied");

  if (Notification.permission === "default") callbacks.onPermissionRequest?.();
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "permission-denied" : "permission-dismissed");

  callbacks.onSubscribing?.();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("vapid-public-key-missing");

  const registration = await getPeerFootballServiceWorkerRegistration();
  if (!registration) throw new Error("service-worker-unavailable");
  let subscription = await registration.pushManager.getSubscription();
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  try {
    await saveSubscription(subscription);
  } catch (error) {
    await subscription.unsubscribe().catch(() => false);
    throw error;
  }

  return subscription;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  const response = await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
    credentials: "same-origin"
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok) throw new Error(result.message || "backend-unsubscribe-failed");
  await subscription.unsubscribe();
}

export async function syncExistingPushSubscription() {
  if (!shouldAttemptSilentPushSync(
    webPushFeatureEnabled,
    hasPushBrowserApis(),
    typeof Notification === "undefined" ? "default" : Notification.permission
  )) return false;

  const registration = await getPeerFootballServiceWorkerRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return false;

  await saveSubscription(subscription);
  return true;
}

export function shouldAttemptSilentPushSync(
  enabled: boolean,
  supported: boolean,
  permission: NotificationPermission
) {
  return enabled && supported && permission === "granted";
}

export async function detachPushSubscriptionFromAccount() {
  if (!hasPushBrowserApis() || Notification.permission !== "granted") return false;

  const registration = await getPeerFootballServiceWorkerRegistration({ registerIfMissing: false });
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return false;

  const response = await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
    credentials: "same-origin",
    keepalive: true
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok) throw new Error(result.message || "backend-detach-failed");
  return true;
}

export async function getPushStatus(): Promise<PushClientStatus> {
  const supported = isPushSupported();
  const permission = typeof Notification === "undefined" ? "default" : Notification.permission;
  if (!supported) return { enabled: webPushFeatureEnabled, supported: false, permission, subscribed: false };

  const subscription = await getCurrentPushSubscription();
  const endpoint = subscription?.endpoint;
  const response = await fetch(`/api/push/status${endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : ""}`, {
    credentials: "same-origin",
    cache: "no-store"
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok || !result.data) throw new Error(result.message || "status-failed");

  return {
    enabled: Boolean(result.data.enabled),
    supported,
    permission,
    subscribed: Boolean(subscription && result.data.subscribed)
  };
}

async function saveSubscription(subscription: PushSubscription) {
  const input = toSubscriptionInput(subscription);
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin"
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok) throw new Error(result.message || "backend-subscribe-failed");
}

function hasPushBrowserApis() {
  return typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator
    && "PushManager" in window;
}

function toSubscriptionInput(subscription: PushSubscription): PushSubscriptionInput {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("invalid-browser-subscription");
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

type ApiResult = { ok: boolean; message?: string; data?: Record<string, unknown> };

async function readApiResult(response: Response): Promise<ApiResult> {
  try {
    return await response.json() as ApiResult;
  } catch {
    return { ok: false, message: "invalid-server-response" };
  }
}
