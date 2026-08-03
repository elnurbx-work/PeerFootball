"use client";

import { useEffect } from "react";
import { registerPeerFootballServiceWorker } from "@/lib/service-worker";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const pushEnabled = process.env.NEXT_PUBLIC_WEB_PUSH_ENABLED === "true";

    if (process.env.NODE_ENV !== "production" && !pushEnabled) {
      void removeDevelopmentServiceWorker().catch(() => undefined);

      return;
    }

    const registerServiceWorker = () => {
      void registerPeerFootballServiceWorker().catch(() => undefined);
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}

async function removeDevelopmentServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL.endsWith("/sw.js"))
      )
      .map((registration) => registration.unregister())
  );

  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("fanpitch-pwa-"))
        .map((key) => window.caches.delete(key))
    );
  }
}
