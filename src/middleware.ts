import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";

const productionHost = "peerfootball.vercel.app";
const authenticatedRoute = /^\/(?:clubs(?:\/|$)|create\/?$|direct\/?$|feedback\/?$|friends\/?$|matches(?:\/|$)|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|teams\/?$)/;
const personalizedRoute = /^\/(?:admin(?:\/|$)|api(?:\/|$)|auth(?:\/|$)|clubs(?:\/|$)|create\/?$|direct\/?$|feed\/?$|feedback\/?$|friends\/?$|matches(?:\/|$)|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|teams\/?$)/;
const sessionCookieNames = ["fanpitch.session-token", "__Secure-fanpitch.session-token"];

function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) =>
    sessionCookieNames.some((cookieName) => name === cookieName || name.startsWith(`${cookieName}.`))
  );
}

export async function middleware(request: NextRequest) {
  const startedAt = performanceNow();
  const pathnameCategory = getPathnameCategory(request.nextUrl.pathname);
  const requestType = request.headers.has("rsc") ? "rsc" : request.method.toLowerCase();
  const finish = (response: NextResponse) => {
    const durationMs = performanceNow() - startedAt;
    logPerformance("middleware.total", durationMs, "success", {
      route: pathnameCategory,
      pathnameCategory,
      requestType
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

    return response;
  };
  const host = request.headers.get("host");
  const routeLocale = request.nextUrl.pathname.match(/^\/(az|en|ru)(?:\/|$)/)?.[1];

  if (
    process.env.NODE_ENV === "production" &&
    host &&
    host !== productionHost &&
    host.endsWith(".vercel.app")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = productionHost;

    return finish(NextResponse.redirect(url));
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
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
      return finish(NextResponse.redirect(new URL("/admin/login", request.url)));
    }

    if (authenticated && isLoginPage) {
      return finish(NextResponse.redirect(new URL("/admin", request.url)));
    }
  }

  if (authenticatedRoute.test(request.nextUrl.pathname) && !hasSessionCookie(request)) {
    return finish(NextResponse.redirect(new URL("/auth/login", request.url)));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-fanpitch-route-locale");
  if (routeLocale) {
    requestHeaders.set("x-fanpitch-route-locale", routeLocale);
  }

  return finish(NextResponse.next({ request: { headers: requestHeaders } }));
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
