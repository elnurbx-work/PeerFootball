const CACHE_PREFIX = "fanpitch-pwa";
const CACHE_VERSION = "v3";
const STATIC_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-runtime`;
const CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);
const STATIC_CACHE_MAX_ENTRIES = 80;
const RUNTIME_CACHE_MAX_ENTRIES = 40;
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192",
  "/icons/icon-512",
  "/icons/icon-maskable",
  "/icons/apple-touch-icon"
];
const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/clubs",
  "/create",
  "/direct",
  "/feed",
  "/feedback",
  "/friends",
  "/matches",
  "/notifications",
  "/profile",
  "/search",
  "/settings",
  "/teams"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheSafeAssets().then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && !CURRENT_CACHES.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (shouldBypassRequest(request)) {
    return;
  }

  const url = new URL(request.url);

  if (isImmutableNextAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, STATIC_CACHE_MAX_ENTRIES));
    return;
  }

  if (isSafeRuntimeAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, RUNTIME_CACHE_MAX_ENTRIES));
  }
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "PeerFootball",
    body: "Yeni bildirişiniz var.",
    icon: "/icons/icon-192",
    badge: "/icons/icon-192",
    tag: "peerfootball-notification",
    url: "/notifications"
  };
  let payload = fallback;

  try {
    const parsed = event.data?.json();
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.title === "string" &&
      typeof parsed.body === "string" &&
      typeof parsed.url === "string"
    ) {
      payload = { ...fallback, ...parsed };
    }
  } catch {
    // A malformed provider payload must still produce a useful notification.
  }

  const options = {
    body: payload.body,
    icon: payload.icon || fallback.icon,
    badge: payload.badge || fallback.badge,
    tag: payload.tag || fallback.tag,
    renotify: false,
    data: {
      url: toSafeAppPath(payload.url) || fallback.url,
      notificationId: typeof payload.notificationId === "string" ? payload.notificationId : undefined,
      type: typeof payload.type === "string" ? payload.type : undefined
    }
  };
  if (typeof payload.image === "string") {
    options.image = payload.image;
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = toSafeAppPath(event.notification.data?.url);
  if (!targetPath) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windowClients) => {
      const targetUrl = new URL(targetPath, self.location.origin).href;
      const client = windowClients.find((candidate) => new URL(candidate.url).origin === self.location.origin);

      if (client) {
        try {
          if ("navigate" in client && client.url !== targetUrl) {
            await client.navigate(targetUrl);
          }
          return client.focus();
        } catch {
          return self.clients.openWindow(targetUrl);
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("notificationclose", () => {
  // Reserved for privacy-safe aggregate telemetry in a future version.
});

async function precacheSafeAssets() {
  const cache = await caches.open(RUNTIME_CACHE);

  await Promise.all(
    PRECACHE_URLS.map(async (url) => {
      try {
        const request = new Request(url, { cache: "reload", credentials: "omit" });
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
          await cache.put(request, response);
        }
      } catch {
        // Installation must still succeed when an optional icon or manifest is unavailable.
      }
    })
  );

  await trimCache(RUNTIME_CACHE, RUNTIME_CACHE_MAX_ENTRIES);
}

function shouldBypassRequest(request) {
  if (request.method !== "GET" || request.mode === "navigate" || request.destination === "document") {
    return true;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return true;
  }

  if (
    url.pathname === "/_next/image" ||
    PRIVATE_PATH_PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  return (
    url.searchParams.has("_rsc") ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.has("authorization")
  );
}

function isImmutableNextAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isSafeRuntimeAsset(request, url) {
  if (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/")
  ) {
    return true;
  }

  return (
    ["font", "image"].includes(request.destination) &&
    /\.(?:avif|gif|ico|jpg|jpeg|png|svg|webp|woff|woff2)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName, maximumEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (isCacheableResponse(networkResponse)) {
    await cache.put(request, networkResponse.clone());
    await trimCache(cacheName, maximumEntries);
  }

  return networkResponse;
}

async function staleWhileRevalidate(request, cacheName, maximumEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(request, response.clone());
        await trimCache(cacheName, maximumEntries);
      }

      return response;
    })
    .catch((error) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    });

  return cachedResponse || networkResponsePromise;
}

function isCacheableResponse(response) {
  if (
    response.status !== 200 ||
    response.redirected ||
    response.type !== "basic"
  ) {
    return false;
  }

  const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
  const vary = response.headers.get("vary")?.toLowerCase() ?? "";

  return (
    !cacheControl.includes("no-store") &&
    !cacheControl.includes("private") &&
    !vary.split(",").some((value) => value.trim() === "cookie")
  );
}

async function trimCache(cacheName, maximumEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - maximumEntries;

  if (overflow > 0) {
    await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
  }
}

function toSafeAppPath(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
