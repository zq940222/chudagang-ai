import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createIntlMiddleware(routing);

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/verify",
  "/projects",
  "/developers",
  "/how-it-works",
];

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|zh)/, "") || "/";
  return publicPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // For protected paths, check auth first
  if (!isPublicPath(pathname) && !req.auth) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Apply intl middleware for locale detection and routing
  return intlMiddleware(req as unknown as NextRequest);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
