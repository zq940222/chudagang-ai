"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard/client", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/client/projects", label: "My Projects", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
] as const;

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-1">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === "/dashboard/client"
              ? pathname === "/dashboard/client"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
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
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
