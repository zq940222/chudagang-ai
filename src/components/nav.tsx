"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification/notification-bell";

const navLinks = [
  { href: "/projects", labelKey: "projects" },
  { href: "/developers", labelKey: "developers" },
  { href: "/dashboard/client/projects/new", labelKey: "howItWorks" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
      <nav className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + links */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-on-surface"
          >
            {tc("appName")}
          </Link>

          <ul className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Search + actions + auth */}
        <div className="flex items-center gap-3">
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
              className="bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl pl-10 pr-4 py-1.5 text-sm focus:ring-secondary focus:bg-surface-container-high transition-all outline-none w-56"
              placeholder={t("searchPlaceholder")}
              type="text"
            />
          </div>

          {/* Action icons for logged-in users */}
          {status !== "loading" && session?.user && (
            <>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container/50 rounded-lg transition-all">
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
            <div className="flex items-center gap-2">
              <Button variant="tertiary" size="sm" asChild>
                <Link href="/login">{tc("login")}</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">{tc("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
