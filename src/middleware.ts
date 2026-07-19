import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";

const productionHost = "peerfootball.vercel.app";

export async function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
