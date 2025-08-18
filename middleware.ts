import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/", "/login", "/_next", "/favicon.ico",
  "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public assets and whitelisted paths
  if ([...PUBLIC_PATHS].some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(
    req.cookies.get("sb-access-token") ||
    req.cookies.get("supabase-auth-token") ||
    req.cookies.get("sb:token")
  );

  if (!hasAccessToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (hasAccessToken && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|apple-touch-icon-precomposed.png).*)"],
};
