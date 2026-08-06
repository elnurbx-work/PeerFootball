import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import {
  DOCUMENT_SECURITY_HEADERS,
  createBaselineContentSecurityPolicy,
  createStrictAdSenseContentSecurityPolicy
} from "@/lib/security/headers";

const productionHost = "peerfootball.vercel.app";
const authenticatedRoute = /^\/(?:clubs(?:\/|$)|create\/?$|direct\/?$|feedback\/?$|friends\/?$|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|tactics(?:\/|$))/;
const personalizedRoute = /^\/(?:admin(?:\/|$)|api(?:\/|$)|auth(?:\/|$)|clubs(?:\/|$)|create\/?$|direct\/?$|feed\/?$|feedback\/?$|friends\/?$|matches(?:\/|$)|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|tactics(?:\/|$)|teams\/?$)/;
const sessionCookieNames = ["fanpitch.session-token", "__Secure-fanpitch.session-token"];
const feedRoute = /^\/feed\/?$/;

function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) =>
    sessionCookieNames.some((cookieName) => name === cookieName || name.startsWith(`${cookieName}.`))
  );
}

export async function middleware(request: NextRequest) {
  const startedAt = performanceNow();
  const context = getRequestSecurityContext(request, startedAt);
  const productionHostRedirect = getProductionHostRedirect(request);
  if (productionHostRedirect) return finishMiddlewareResponse(productionHostRedirect, request, context);

  const adminRouteResponse = await handleAdminRoute(request, context.requestType);
  if (adminRouteResponse) return finishMiddlewareResponse(adminRouteResponse, request, context);

  const authenticatedRouteRedirect = getAuthenticatedRouteRedirect(request);
  if (authenticatedRouteRedirect) return finishMiddlewareResponse(authenticatedRouteRedirect, request, context);

  const requestHeaders = buildForwardedRequestHeaders(request, context);
  return finishMiddlewareResponse(
    NextResponse.next({ request: { headers: requestHeaders } }),
    request,
    context
  );
}

type MiddlewareSecurityContext = {
  startedAt: number;
  pathnameCategory: string;
  requestType: string;
  isProductionDocument: boolean;
  nonce: string | null;
  contentSecurityPolicy: string;
  routeLocale: string | undefined;
};

function getRequestSecurityContext(request: NextRequest, startedAt: number): MiddlewareSecurityContext {
  const pathnameCategory = getPathnameCategory(request.nextUrl.pathname);
  const requestType = request.headers.has("rsc") ? "rsc" : request.method.toLowerCase();
  const isProductionDocument = process.env.NODE_ENV === "production" && pathnameCategory === "page";
  const nonce = isProductionDocument && feedRoute.test(request.nextUrl.pathname)
    ? crypto.randomUUID().replaceAll("-", "")
    : null;
  const contentSecurityPolicy = nonce
    ? createStrictAdSenseContentSecurityPolicy(nonce)
    : createBaselineContentSecurityPolicy();
  const routeLocale = request.nextUrl.pathname.match(/^\/(az|en|ru)(?:\/|$)/)?.[1];

  return {
    startedAt,
    pathnameCategory,
    requestType,
    isProductionDocument,
    nonce,
    contentSecurityPolicy,
    routeLocale
  };
}

function getProductionHostRedirect(request: NextRequest) {
  const host = request.headers.get("host");

  if (
    process.env.NODE_ENV === "production" &&
    host &&
    host !== productionHost &&
    host.endsWith(".vercel.app")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = productionHost;
    return NextResponse.redirect(url);
  }

  return null;
}

async function handleAdminRoute(request: NextRequest, requestType: string) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return null;

  const authenticated = await measureAsync(
    "adminAuth.middlewareVerify",
    () => verifyAdminSessionToken(
      request.cookies.get(adminSessionCookieName)?.value,
      process.env.ADMIN_EMAIL,
      process.env.AUTH_SECRET
    ),
    { route: "admin", requestType }
  );
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!authenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (authenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return null;
}

function getAuthenticatedRouteRedirect(request: NextRequest) {
  if (!authenticatedRoute.test(request.nextUrl.pathname) || hasSessionCookie(request)) return null;
  return NextResponse.redirect(new URL("/auth/login", request.url));
}

function buildForwardedRequestHeaders(request: NextRequest, context: MiddlewareSecurityContext) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-fanpitch-route-locale");

  if (context.routeLocale) {
    requestHeaders.set("x-fanpitch-route-locale", context.routeLocale);
  }
  if (context.nonce) {
    requestHeaders.set("x-nonce", context.nonce);
    requestHeaders.set("Content-Security-Policy", context.contentSecurityPolicy);
  }

  return requestHeaders;
}

function finishMiddlewareResponse(
  response: NextResponse,
  request: NextRequest,
  context: MiddlewareSecurityContext
) {
  const durationMs = performanceNow() - context.startedAt;
  logPerformance("middleware.total", durationMs, "success", {
    route: context.pathnameCategory,
    pathnameCategory: context.pathnameCategory,
    requestType: context.requestType
  });

  if (process.env.NODE_ENV === "development") {
    const currentServerTiming = response.headers.get("Server-Timing");
    const middlewareTiming = `middleware;dur=${durationMs.toFixed(2)}`;
    response.headers.set(
      "Server-Timing",
      currentServerTiming ? `${currentServerTiming}, ${middlewareTiming}` : middlewareTiming
    );
  }

  if (personalizedRoute.test(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }

  if (context.isProductionDocument) {
    response.headers.set("Content-Security-Policy", context.contentSecurityPolicy);
    for (const [name, value] of Object.entries(DOCUMENT_SECURITY_HEADERS)) {
      response.headers.set(name, value);
    }
  }

  return response;
}

function getPathnameCategory(pathname: string) {
  if (pathname.startsWith("/_next/")) return "next-internal";
  if (pathname.startsWith("/api/")) return "api";
  if (/\.[a-z0-9]+$/i.test(pathname)) return "asset";
  if (pathname.startsWith("/")) return "page";
  return "other";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
