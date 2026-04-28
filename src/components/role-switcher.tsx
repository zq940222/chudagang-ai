"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { switchRole } from "@/lib/actions/switch-role";
import type { UserRole } from "@prisma/client";

export function RoleSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("roleSwitcher");
  const [loading, setLoading] = useState(false);

  if (!session?.user) return null;

  const { role, roles } = session.user;
  const targetRole: UserRole = role === "CLIENT" ? "DEVELOPER" : "CLIENT";
  const hasTargetRole = roles?.includes(targetRole);

  async function handleSwitch() {
    setLoading(true);
    const result = await switchRole(targetRole);
    if (result.error) {
      setLoading(false);
      return;
    }
    await update({ activeRole: targetRole });
    router.replace(
      targetRole === "DEVELOPER"
        ? `/${locale}/dashboard/developer`
        : `/${locale}/dashboard/client`
    );
    setLoading(false);
  }

  const label = hasTargetRole
    ? targetRole === "DEVELOPER"
      ? t("switchToDeveloper")
      : t("switchToClient")
    : targetRole === "DEVELOPER"
      ? t("enableDeveloper")
      : t("enableClient");

  const currentLabel =
    role === "CLIENT" ? t("currentClient") : t("currentDeveloper");

  return (
    <button
      onClick={handleSwitch}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant transition-all hover:-translate-y-0.5 hover:bg-white/35 hover:text-on-surface disabled:opacity-50 liquid-glass-vivid"
      title={label}
    >
      <span className="hidden lg:inline">{currentLabel}</span>
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
      <span className="hidden xl:inline text-xs text-on-surface-variant/70">
        {label}
      </span>
    </button>
  );
}
