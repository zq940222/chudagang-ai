import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:py-40">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-accent-cyan/10 blur-[120px] animate-pulse" />
        <div className="absolute right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-tertiary/10 blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="mx-auto max-w-4xl text-center relative">
        {/* Floating decorative element with glassmorphism */}
        <div className="hidden lg:block absolute -left-20 top-0 w-24 h-24 glass rounded-2xl ghost-border -rotate-12 animate-bounce [animation-duration:4s]" />
        <div className="hidden lg:block absolute -right-16 bottom-10 w-20 h-20 glass rounded-full ghost-border rotate-12 animate-bounce [animation-duration:5s]" />

        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl lg:text-7xl leading-[1.1]">
          {t("heroTitle")}{" "}
          <span className="bg-gradient-to-r from-accent-cyan via-tertiary to-accent-cyan bg-[length:200%_auto] animate-text-gradient bg-clip-text text-transparent">
            {t("heroHighlight")}
          </span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-on-surface-variant/80">
          {t("heroSubtitle")}
        </p>
        <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl bg-primary px-10 text-base font-bold text-on-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/20 to-tertiary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">{t("ctaStart")}</span>
          </Link>
          <Link
            href="/developers"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-surface-container-high px-10 text-base font-semibold text-on-surface ghost-border transition-all hover:bg-surface-container-highest hover:scale-[1.02]"
          >
            {t("ctaBrowse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
