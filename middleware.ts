import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const isAuthenticated = !!session;

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
