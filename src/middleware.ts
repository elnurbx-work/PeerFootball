import { NextResponse, type NextRequest } from "next/server";

const productionHost = "peerfootball.vercel.app";

export function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
