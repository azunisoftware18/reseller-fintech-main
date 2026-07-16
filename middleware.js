import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("accessToken");
  const pathname = req.nextUrl.pathname;

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
