const baseUrl = process.env.PERF_BASE_URL ?? "http://127.0.0.1:3130";
const thresholdMs = Number(process.env.PERF_THRESHOLD_MS ?? "50");
const warmupRuns = Number(process.env.PERF_WARMUP_RUNS ?? "3");
const sampleRuns = Number(process.env.PERF_SAMPLE_RUNS ?? "10");
const authenticatedMode = process.env.PERF_AUTHENTICATED === "true";
const showTable = process.env.PERF_TABLE !== "false";
const requestTimeoutMs = Number(process.env.PERF_REQUEST_TIMEOUT_MS ?? "15000");

const locales = ["az", "en", "ru"];
const topics = [
  "football-social-network",
  "local-football-match-organizer",
  "find-football-players",
  "football-club-management"
];

const staticRoutes = [
  "/",
  "/ads.txt",
  "/admin",
  "/admin/feedback",
  "/admin/login",
  "/admin/posts",
  "/admin/reports",
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/clubs",
  "/clubs/new",
  "/create",
  "/direct",
  "/feed",
  "/feedback",
  "/friends",
  "/install",
  "/matches",
  "/notifications",
  "/offline",
  "/profile",
  "/robots.txt",
  "/search",
  "/settings",
  "/sitemap.xml",
  "/teams"
];

let dynamicRoutes = [
  "/admin/posts/performance-test",
  "/clubs/performance-test",
  "/clubs/performance-test/guests",
  "/clubs/performance-test/matches",
  "/clubs/performance-test/matches/new/club-vs-club",
  "/clubs/performance-test/matches/new/internal",
  "/clubs/performance-test/members",
  "/clubs/performance-test/metrics",
  "/clubs/performance-test/settings",
  "/matches/performance-test",
  "/profile/performance-test"
];

const routeAliases = new Map();
let userSessionCookie;
let adminSessionCookie;

if (authenticatedMode) {
  const context = await createAuthenticatedContext();
  userSessionCookie = context.userSessionCookie;
  adminSessionCookie = context.adminSessionCookie;
  dynamicRoutes = context.dynamicRoutes;
  for (const [route, alias] of context.routeAliases) {
    routeAliases.set(route, alias);
  }
}

const marketingRoutes = locales.flatMap((locale) => [
  `/${locale}`,
  `/${locale}/about`,
  ...topics.map((topic) => `/${locale}/${topic}`)
]);

const configuredRoutes = process.env.PERF_ROUTES
  ?.split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const routes = (configuredRoutes?.length
  ? configuredRoutes
  : [...new Set([...staticRoutes, ...dynamicRoutes, ...marketingRoutes])]
).sort();

function percentile(values, percentage) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentage / 100) * sorted.length) - 1);
  return sorted[index];
}

async function loadPage(route) {
  const cookie = getCookieForRoute(route);
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: {
        "user-agent": "FanPitch-Local-Performance-Benchmark/1.0",
        ...(cookie ? { cookie } : {})
      }
    });
    const body = await response.arrayBuffer();
    return {
      durationMs: performance.now() - startedAt,
      status: response.status,
      finalPath: new URL(response.url).pathname,
      bytes: body.byteLength,
      error: null
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Benchmark request failed for ${routeAliases.get(route) ?? route}: ${errorName}`);
    return {
      durationMs: performance.now() - startedAt,
      status: 0,
      finalPath: route,
      bytes: 0,
      error: errorName
    };
  }
}

function getCookieForRoute(route) {
  if (!authenticatedMode) return undefined;
  if (route.startsWith("/admin") && route !== "/admin/login") return adminSessionCookie;
  if (/^\/(?:clubs(?:\/|$)|create\/?$|direct\/?$|feed\/?$|feedback\/?$|friends\/?$|matches(?:\/|$)|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|teams\/?$)/.test(route)) {
    return userSessionCookie;
  }
  return undefined;
}

async function createAuthenticatedContext() {
  process.loadEnvFile?.(".env.local");
  const [{ encode }, { neonConfig }, { PrismaNeon }, { PrismaClient }, { createHmac }] = await Promise.all([
    import("@auth/core/jwt"),
    import("@neondatabase/serverless"),
    import("@prisma/adapter-neon"),
    import("@prisma/client"),
    import("node:crypto")
  ]);

  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    throw new Error("PERF_AUTHENTICATED requires DATABASE_URL and AUTH_SECRET.");
  }

  neonConfig.webSocketConstructor = WebSocket;
  const databaseUrl = new URL(process.env.DATABASE_URL);
  databaseUrl.searchParams.delete("channel_binding");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl.toString() })
  });

  try {
    const ownerMembership = await prisma.clubMember.findFirst({
      where: {
        status: "ACTIVE",
        role: "OWNER",
        club: { isActive: true },
        user: { email: { not: null }, username: { not: null }, isBanned: false }
      },
      select: {
        club: { select: { id: true, slug: true } },
        user: { select: { id: true, email: true, name: true, username: true, image: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    if (!ownerMembership?.user.email || !ownerMembership.user.username) {
      throw new Error("No eligible club owner exists for the authenticated benchmark.");
    }

    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { creatorClubId: ownerMembership.club.id },
          { homeClubId: ownerMembership.club.id },
          { awayClubId: ownerMembership.club.id }
        ]
      },
      select: { id: true },
      orderBy: { createdAt: "asc" }
    });
    const post = await prisma.post.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });

    const secureSessionCookie = process.env.AUTH_URL?.startsWith("https://") ?? true;
    const sessionCookieName = `${secureSessionCookie ? "__Secure-" : ""}fanpitch.session-token`;
    const token = await encode({
      salt: sessionCookieName,
      secret: process.env.AUTH_SECRET,
      token: {
        id: ownerMembership.user.id,
        sub: ownerMembership.user.id,
        name: ownerMembership.user.name,
        email: ownerMembership.user.email,
        picture: ownerMembership.user.image,
        username: ownerMembership.user.username
      }
    });

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || process.env.AUTH_SECRET.length < 32) {
      throw new Error("PERF_AUTHENTICATED requires ADMIN_EMAIL and an AUTH_SECRET of at least 32 characters.");
    }
    const payload = Buffer.from(
      JSON.stringify({
        email: adminEmail,
        expiresAt: Date.now() + 60 * 60 * 1000,
        purpose: "session"
      })
    ).toString("base64url");
    const signature = createHmac("sha256", process.env.AUTH_SECRET).update(payload).digest("base64url");

    const clubPath = `/clubs/${encodeURIComponent(ownerMembership.club.slug)}`;
    const resolvedDynamicRoutes = [
      ...(post ? [`/admin/posts/${post.id}`] : []),
      clubPath,
      `${clubPath}/guests`,
      `${clubPath}/matches`,
      `${clubPath}/matches/new/club-vs-club`,
      `${clubPath}/matches/new/internal`,
      `${clubPath}/members`,
      `${clubPath}/metrics`,
      `${clubPath}/settings`,
      ...(match ? [`/matches/${match.id}`] : []),
      `/profile/${encodeURIComponent(ownerMembership.user.username)}`
    ];
    const aliases = new Map(
      resolvedDynamicRoutes.map((route) => [
        route,
        route
          .replace(`/admin/posts/${post?.id}`, "/admin/posts/:postId")
          .replace(clubPath, "/clubs/:slug")
          .replace(`/matches/${match?.id}`, "/matches/:matchId")
          .replace(`/profile/${encodeURIComponent(ownerMembership.user.username)}`, "/profile/:username")
      ])
    );

    return {
      userSessionCookie: `${sessionCookieName}=${token}`,
      adminSessionCookie: `__Secure-fanpitch-admin=${payload}.${signature}`,
      dynamicRoutes: resolvedDynamicRoutes,
      routeAliases: aliases
    };
  } finally {
    await prisma.$disconnect();
  }
}

for (let run = 0; run < warmupRuns; run += 1) {
  for (const route of routes) {
    await loadPage(route);
  }
}

const samples = new Map(routes.map((route) => [route, []]));
const responseDetails = new Map();

for (let run = 0; run < sampleRuns; run += 1) {
  for (const route of routes) {
    const result = await loadPage(route);
    samples.get(route).push(result.durationMs);
    responseDetails.set(route, result);
  }
}

const results = routes
  .map((route) => {
    const durations = samples.get(route);
    const details = responseDetails.get(route);
    return {
      route,
      medianMs: percentile(durations, 50),
      p95Ms: percentile(durations, 95),
      status: details.status,
      finalPath: details.finalPath,
      bytes: details.bytes,
      error: details.error
    };
  })
  .sort((a, b) => b.p95Ms - a.p95Ms);

console.log(
  `Benchmark: ${baseUrl}, mode=${authenticatedMode ? "authenticated" : "unauthenticated"}, ${routes.length} routes, ${warmupRuns} warmups, ${sampleRuns} samples, sequential requests`
);
if (showTable) {
  console.table(
    results.map((result) => ({
      route: routeAliases.get(result.route) ?? result.route,
      status: result.status,
      final: result.finalPath,
      bytes: result.bytes,
      median_ms: result.medianMs.toFixed(2),
      p95_ms: result.p95Ms.toFixed(2)
    }))
  );
}

const failures = results.filter((result) => result.p95Ms >= thresholdMs);
const nonSuccessful = results.filter((result) => result.status === 0 || result.status >= 400);

console.log(
  JSON.stringify(
    {
      thresholdMs,
      slowestP95Ms: Number(results[0].p95Ms.toFixed(2)),
      slowestRoutes: results.slice(0, 10).map((result) => ({
        route: routeAliases.get(result.route) ?? result.route,
        medianMs: Number(result.medianMs.toFixed(2)),
        p95Ms: Number(result.p95Ms.toFixed(2))
      })),
      failingRoutes: failures.map((result) => routeAliases.get(result.route) ?? result.route),
      nonSuccessfulRoutes: nonSuccessful.map((result) => ({
        route: routeAliases.get(result.route) ?? result.route,
        status: result.status,
        error: result.error
      }))
    },
    null,
    2
  )
);

if (failures.length || nonSuccessful.length) {
  process.exitCode = 1;
}
