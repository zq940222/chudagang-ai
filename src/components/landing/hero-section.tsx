import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
  stats?: { developerCount: number; projectCount: number; completedCount: number };
}

export function HeroSection({ t, stats }: HeroSectionProps) {
  return (
    <section className="section-shell relative overflow-hidden px-8 py-24 sm:py-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="liquid-orb left-[-5rem] top-10 h-[26rem] w-[26rem] bg-accent-cyan/18" />
        <div className="liquid-orb right-[-7rem] top-[-2rem] h-[30rem] w-[30rem] bg-tertiary/16" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-8">
          <div className="space-y-5">
            <span className="liquid-glass-vivid liquid-line liquid-float inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-on-surface-variant">
              {t("heroTagline")}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.02] font-black tracking-[-0.04em] text-on-surface lg:text-7xl">
              {t("heroTitle")}
              <br />
              <span className="animate-text-gradient bg-[linear-gradient(120deg,#1f2735_0%,#5f756d_34%,#b69b74_66%,#83717a_100%)] bg-[length:220%_220%] bg-clip-text text-transparent">
                {t("heroHighlight")}
              </span>
              <br />
              {t("heroTitle2")}
            </h1>
            <p className="max-w-xl text-[1.05rem] leading-8 text-on-surface-variant">
              {t("heroSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="liquid-glass-vivid liquid-panel liquid-float rounded-[1.6rem] px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                {t("heroMetricAccuracyLabel")}
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-on-surface">
                {t("heroMetricAccuracyValue")}
              </div>
            </div>
            <div className="liquid-glass-vivid liquid-panel liquid-float rounded-[1.6rem] px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                {t("heroMetricTimeLabel")}
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-on-surface">
                {t("heroMetricTimeValue")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/chat"
              className="liquid-button inline-flex items-center gap-2 rounded-[1.4rem] px-8 py-4 font-bold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              {t("ctaStart")}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="liquid-glass-vivid liquid-panel liquid-float inline-flex items-center rounded-[1.4rem] px-8 py-4 font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="liquid-glass-vivid liquid-panel liquid-float liquid-refract rounded-[2.25rem] p-3">
            <div className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[1.8rem] bg-[linear-gradient(145deg,rgba(245,239,230,0.92)_0%,rgba(223,214,199,0.7)_52%,rgba(201,185,164,0.54)_100%)] p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.62),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(154,215,207,0.24),transparent_18%),radial-gradient(circle_at_65%_85%,rgba(190,164,181,0.18),transparent_22%)]" />
              <div className="absolute inset-3 rounded-[1.5rem] border border-white/45" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="liquid-glass-vivid liquid-float max-w-[52%] rounded-[1.4rem] px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                    {t("heroPoolLabel")}
                  </div>
                  <div className="mt-1 text-lg font-black tracking-tight text-on-surface">
                    {stats && stats.developerCount > 0 ? `${stats.developerCount.toLocaleString()} ${t("heroPoolUnit")}` : t("heroPoolValue")}
                  </div>
                </div>
                <div className="liquid-glass-vivid liquid-float rounded-[1.4rem] px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                    {t("heroProjectsLabel")}
                  </div>
                  <div className="mt-1 text-lg font-black tracking-tight text-on-surface">
                    {stats && stats.projectCount > 0 ? stats.projectCount.toLocaleString() : t("heroSignalValue")}
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-24 right-10 h-28 w-28 rounded-full border border-white/50 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.18)_56%,transparent_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_24px_48px_rgba(94,85,72,0.14)]" />

              <div className="relative z-10 mt-8 space-y-4 rounded-[1.8rem] liquid-glass-dark-vivid liquid-refract p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                    <svg className="h-5 w-5 text-[color:var(--color-accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/58">
                      {t("heroDeploymentLabel")}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {t("heroDeploymentValue")}
                    </div>
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[85%] rounded-full bg-[linear-gradient(90deg,#d4b185_0%,#93d0c7_100%)]" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[1.2rem] bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/52">{t("heroLatencyLabel")}</div>
                    <div className="mt-1 text-sm font-bold text-white">{t("heroLatencyValue")}</div>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/52">{t("heroShortlistLabel")}</div>
                    <div className="mt-1 text-sm font-bold text-white">{t("heroShortlistValue")}</div>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/52">{t("heroReadinessLabel")}</div>
                    <div className="mt-1 text-sm font-bold text-white">{t("heroReadinessValue")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
