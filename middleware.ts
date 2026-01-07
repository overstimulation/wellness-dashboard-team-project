import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  const isAppPage = req.nextUrl.pathname.startsWith("/dashboard") ||
                    req.nextUrl.pathname.startsWith("/progress") ||
                    req.nextUrl.pathname.startsWith("/mood") ||
                    req.nextUrl.pathname.startsWith("/games") ||
                    req.nextUrl.pathname.startsWith("/settings") ||
                    req.nextUrl.pathname.startsWith("/onboarding");

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isAppPage) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/progress", "/mood", "/games", "/settings", "/onboarding", "/login", "/register"],
};
