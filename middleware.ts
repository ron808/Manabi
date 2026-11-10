import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, isProtectedPath } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

// Verifies the session JWT at the edge (not just that a cookie exists).
// Pages and API routes still check the user against the database.
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = !!req.auth?.user;

  if (!signedIn && isProtectedPath(pathname)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (signedIn && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/today/:path*",
    "/new/:path*",
    "/test/:path*",
    "/results/:path*",
    "/review/:path*",
    "/history/:path*",
    "/settings/:path*",
  ],
};
