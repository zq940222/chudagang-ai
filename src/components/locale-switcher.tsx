"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const targetLocale = locale === "en" ? "zh" : "en";
  const label = locale === "en" ? "中文" : "EN";

  function handleSwitch() {
    router.replace(pathname, { locale: targetLocale });
  }

  return (
    <button
      onClick={handleSwitch}
      className="rounded-md px-2.5 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-accent-cyan cursor-pointer"
      aria-label={`Switch to ${targetLocale}`}
    >
      {label}
    </button>
  );
}
