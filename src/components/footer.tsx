import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-outline-variant/20 bg-surface-container-lowest">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-on-surface">
          {t("appName")}
        </p>
        <p className="text-xs text-on-surface-variant">{t("tagline")}</p>
        <p className="mt-4 text-xs text-on-surface-variant/60">
          &copy; {new Date().getFullYear()} {t("appName")}
        </p>
      </div>
    </footer>
  );
}
