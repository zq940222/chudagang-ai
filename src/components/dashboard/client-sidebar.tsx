"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { clientSidebarLinks } from "./client-sidebar-links";

export { clientSidebarLinks };

export function ClientSidebar() {
  const pathname = usePathname();
  const t = useTranslations("clientSidebar");

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1.5">
        {clientSidebarLinks.map((link) => {
          const isActive =
            link.href === "/dashboard/client"
              ? pathname === "/dashboard/client"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                isActive
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                  : "text-on-surface-variant/70 hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <svg
                className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-accent-cyan" : "text-on-surface-variant/40")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
