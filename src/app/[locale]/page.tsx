import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <>
      <Nav />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
          {tc("appName")}
        </h1>
        <p className="mt-2 text-lg font-medium text-accent-cyan">
          {tc("tagline")}
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/projects"
            className="inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-r from-primary to-primary-container px-6 text-base font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            {t("ctaStart")}
          </Link>
          <Link
            href="/developers"
            className="inline-flex h-12 items-center justify-center rounded-md bg-surface-container-highest px-6 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            {t("ctaBrowse")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
