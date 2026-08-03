"use client";

import type { PushClientStatus, PushSubscriptionInput } from "@/types/push.types";

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
  const registration = await getServiceWorkerRegistration();
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!webPushFeatureEnabled) throw new Error("disabled");
  if (!isPushSupported()) throw new Error("unsupported");
  if (Notification.permission === "denied") throw new Error("permission-denied");

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "permission-denied" : "permission-dismissed");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("vapid-public-key-missing");

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  const input = toSubscriptionInput(subscription);
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin"
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok) {
    await subscription.unsubscribe().catch(() => false);
    throw new Error(result.message || "backend-subscribe-failed");
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

async function getServiceWorkerRegistration() {
  let registration = await navigator.serviceWorker.getRegistration("/");
  registration ??= await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  if (!registration.active) {
    registration = await navigator.serviceWorker.ready;
  }
  return registration;
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
