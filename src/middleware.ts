import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

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

  if (!isPublicPath(pathname) && !req.auth) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
