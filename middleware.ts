import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SHOW_CUSTOMER_AUTH, TREATWELL_BOOKING_URL } from "@/lib/siteConfig";

export function middleware(request: NextRequest) {
  if (SHOW_CUSTOMER_AUTH) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/buchung")) {
    return NextResponse.redirect(TREATWELL_BOOKING_URL);
  }

  const blockedPrefixes = [
    "/login",
    "/register",
    "/konto",
    "/auth/",
    "/verify-email",
    "/passwort-vergessen",
    "/passwort-zuruecksetzen",
  ];

  if (blockedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/buchung/:path*",
    "/login",
    "/register",
    "/konto/:path*",
    "/auth/:path*",
    "/verify-email",
    "/passwort-vergessen",
    "/passwort-zuruecksetzen",
  ],
};
