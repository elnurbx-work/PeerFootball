import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";

const productionHost = "peerfootball.vercel.app";
const authenticatedRoute = /^\/(?:clubs(?:\/|$)|create\/?$|direct\/?$|feedback\/?$|friends\/?$|matches(?:\/|$)|notifications\/?$|profile(?:\/|$)|search\/?$|settings\/?$|teams\/?$)/;
const sessionCookieNames = ["fanpitch.session-token", "__Secure-fanpitch.session-token"];

function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) =>
    sessionCookieNames.some((cookieName) => name === cookieName || name.startsWith(`${cookieName}.`))
  );
}

export async function middleware(request: NextRequest) {
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

    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authenticated = await verifyAdminSessionToken(
      request.cookies.get(adminSessionCookieName)?.value,
      process.env.ADMIN_EMAIL,
      process.env.AUTH_SECRET
    );
    const isLoginPage = request.nextUrl.pathname === "/admin/login";

    if (!authenticated && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (authenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (authenticatedRoute.test(request.nextUrl.pathname) && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-fanpitch-route-locale");
  if (routeLocale) {
    requestHeaders.set("x-fanpitch-route-locale", routeLocale);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
