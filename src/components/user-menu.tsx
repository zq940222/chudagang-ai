"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "@/i18n/navigation";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("common");

  const initial = (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  const dashboardPath =
    user.role === "DEVELOPER" ? "/dashboard/developer" : "/dashboard/client";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-opacity hover:opacity-80 cursor-pointer"
          aria-label="User menu"
        >
          {initial}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[160px] rounded-xl bg-surface-container-lowest p-1.5 shadow-lg ghost-border animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={dashboardPath}
              className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-high outline-none"
            >
              {t("dashboard")}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-high outline-none"
            >
              {t("settings")}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-outline-variant/20" />

          <DropdownMenu.Item
            onSelect={() => signOut()}
            className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-error transition-colors hover:bg-error-container outline-none"
          >
            {t("logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
