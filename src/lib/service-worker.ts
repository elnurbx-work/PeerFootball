"use client";

export function supportsServiceWorker() {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

export async function getPeerFootballServiceWorkerRegistration(options: {
  registerIfMissing?: boolean;
} = {}) {
  if (!supportsServiceWorker()) return null;

  const registerIfMissing = options.registerIfMissing ?? true;
  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration && registerIfMissing) {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });
  }
  if (!registration) return null;
  return registration.active ? registration : navigator.serviceWorker.ready;
}

export async function registerPeerFootballServiceWorker() {
  const registration = await getPeerFootballServiceWorkerRegistration();
  await registration?.update();
  return registration;
}
