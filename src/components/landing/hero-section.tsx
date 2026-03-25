import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:py-40">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-tertiary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
          {t("heroTitle")}{" "}
          <span className="bg-gradient-to-r from-accent-cyan to-tertiary bg-clip-text text-transparent">
            {t("heroHighlight")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-r from-primary to-primary-container px-8 text-base font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            {t("ctaStart")}
          </Link>
          <Link
            href="/developers"
            className="inline-flex h-12 items-center justify-center rounded-md bg-surface-container-highest px-8 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            {t("ctaBrowse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
