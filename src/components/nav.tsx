"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification/notification-bell";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/projects", labelKey: "projects" },
  { href: "/developers", labelKey: "developers" },
  { href: "/dashboard/client/projects/new", labelKey: "howItWorks" },
] as const;

type DashboardLink = {
  href: string;
  label: string;
};

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const normalizedHref = href.endsWith("/") && href !== "/" ? href.slice(0, -1) : href;

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

export function Nav({ dashboardLinks }: { dashboardLinks?: DashboardLink[] }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className="liquid-glass-vivid liquid-panel liquid-line liquid-float mx-auto flex h-16 max-w-screen-2xl items-center justify-between rounded-[1.75rem] px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + links */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-black tracking-tighter text-on-surface"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl liquid-glass-vivid liquid-refract text-xs text-secondary shadow-sm">
              AI
            </span>
            {tc("appName")}
          </Link>

          <ul className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActiveLink(pathname, link.href)
                      ? "bg-gradient-to-r from-[rgba(154,215,207,0.26)] via-[rgba(255,255,255,0.58)] to-[rgba(212,177,133,0.24)] text-on-surface shadow-[0_10px_28px_rgba(18,21,28,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/55 backdrop-blur-2xl"
                      : "text-on-surface-variant/70 hover:bg-white/35 hover:text-accent-cyan"
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Search + actions + auth */}
        <div className="flex items-center gap-3">
          {/* Hamburger button — mobile only */}
          <button
            className="liquid-glass-vivid rounded-xl p-2 text-on-surface-variant transition-all hover:-translate-y-0.5 hover:text-on-surface md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              /* X icon */
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          {/* Search bar */}
          <div className="relative hidden lg:block">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              className="liquid-input w-56 rounded-2xl border-none pl-10 pr-4 py-2 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
              placeholder={t("searchPlaceholder")}
              type="text"
            />
          </div>

          {/* Action icons for logged-in users */}
          {status !== "loading" && session?.user && (
            <>
              <button className="liquid-glass-vivid rounded-xl p-2 text-on-surface-variant transition-all hover:-translate-y-0.5 hover:text-on-surface">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </button>
              <NotificationBell />
            </>
          )}

          <LocaleSwitcher />

          {status === "loading" ? (
            <div className="h-10 w-20 animate-pulse rounded-md bg-surface-container" />
          ) : session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="tertiary" size="sm" asChild>
                <Link href="/login">{tc("login")}</Link>
              </Button>
              <Button variant="primary" size="sm" className="rounded-xl" asChild>
                <Link href="/register">{tc("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="absolute inset-x-3 top-[calc(100%-0.75rem)] z-40 mt-2 md:hidden">
          <div className="liquid-glass-vivid liquid-panel liquid-line rounded-[1.5rem] px-4 py-5 shadow-lg">
            {/* Main nav links */}
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActiveLink(pathname, link.href)
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-white/35 hover:text-on-surface"
                    )}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Dashboard links */}
            {dashboardLinks && dashboardLinks.length > 0 && (
              <>
                <div className="my-3 border-t border-white/20" />
                <ul className="flex flex-col gap-1">
                  {dashboardLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "block rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                          isActiveLink(pathname, link.href)
                            ? "bg-primary text-on-primary"
                            : "text-on-surface-variant hover:bg-white/35 hover:text-on-surface"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Login / Register — only for logged-out users */}
            {status !== "loading" && !session?.user && (
              <>
                <div className="my-3 border-t border-white/20" />
                <div className="flex flex-col gap-2">
                  <Button variant="tertiary" size="sm" className="w-full justify-center" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      {tc("login")}
                    </Link>
                  </Button>
                  <Button variant="primary" size="sm" className="w-full justify-center rounded-xl" asChild>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      {tc("register")}
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
