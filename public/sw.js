const CACHE_PREFIX = "fanpitch-pwa";
const CACHE_VERSION = "v2";
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
