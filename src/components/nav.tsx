"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification/notification-bell";

const navLinks = [
  { href: "/", labelKey: "home" },
  { href: "/projects", labelKey: "projects" },
  { href: "/developers", labelKey: "developers" },
  { href: "/how-it-works", labelKey: "howItWorks" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 glass ghost-border">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-primary">
          杵大岗AI
        </Link>

        {/* Navigation links */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-accent-cyan"
              >
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: locale switcher + auth */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {status !== "loading" && session?.user && <NotificationBell />}

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
