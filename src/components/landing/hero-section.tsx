import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-8 py-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="liquid-orb right-[-6rem] top-[-6rem] h-[32rem] w-[32rem] bg-accent-cyan/30" />
        <div className="liquid-orb bottom-[-8rem] left-[-3rem] h-[26rem] w-[26rem] bg-tertiary/20" />
        <div className="liquid-orb left-[35%] top-[42%] h-52 w-52 bg-secondary/20" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="space-y-5">
            <span className="liquid-glass-subtle liquid-line inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-tertiary">
              {t("heroTagline")}
            </span>
            <h1 className="text-5xl leading-[1.1] font-black tracking-tight text-on-surface lg:text-6xl">
              {t("heroTitle")}{" "}
              <br />
              <span className="animate-text-gradient bg-gradient-to-r from-secondary via-accent-cyan to-tertiary bg-[length:200%_200%] bg-clip-text text-transparent">
                {t("heroHighlight")}
              </span>{" "}
              <br />
              {t("heroTitle2")}
            </h1>
            <p className="max-w-lg pt-2 text-lg leading-relaxed text-on-surface-variant">
              {t("heroSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="liquid-glass-subtle liquid-panel rounded-2xl px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                Match Accuracy
              </div>
              <div className="mt-1 text-2xl font-black text-on-surface">92%</div>
            </div>
            <div className="liquid-glass-subtle liquid-panel rounded-2xl px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
                Median Time
              </div>
              <div className="mt-1 text-2xl font-black text-on-surface">48h</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/chat"
              className="liquid-button group relative inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-bold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/20"
            >
              {t("ctaStart")}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="liquid-glass-subtle liquid-panel inline-flex items-center rounded-2xl px-8 py-4 font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="liquid-glass liquid-panel liquid-shimmer rounded-[2rem] p-2">
            <div className="liquid-mesh relative aspect-[4/3] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%),linear-gradient(135deg,#18233b_0%,#0f172a_55%,#17203a_100%)] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(0,229,255,0.18),transparent_18%),radial-gradient(circle_at_78%_72%,rgba(157,0,255,0.18),transparent_20%)]" />
              <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-4">
                <div className="liquid-glass-dark rounded-2xl px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">Active Talent Pool</div>
                  <div className="mt-1 text-lg font-black text-white">1,280 specialists</div>
                </div>
                <div className="liquid-glass-subtle rounded-2xl px-4 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">Signal Score</div>
                  <div className="mt-1 text-lg font-black text-on-surface">8.9/10</div>
                </div>
              </div>

              <div className="relative z-10 flex h-full items-end">
                <div className="liquid-glass-dark w-full rounded-[1.75rem] p-5">
                  <div className="mb-3 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-cyan/20">
                      <svg className="h-5 w-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/70">Active Model Deployment</div>
                      <div className="text-sm font-bold text-white">Fine-tuned Llama-3-70B</div>
                    </div>
                  </div>

                  <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-accent-cyan to-secondary" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/6 p-3">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-white/55">Latency</div>
                      <div className="mt-1 text-sm font-bold text-white">120ms</div>
                    </div>
                    <div className="rounded-2xl bg-white/6 p-3">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-white/55">Shortlist</div>
                      <div className="mt-1 text-sm font-bold text-white">6 experts</div>
                    </div>
                    <div className="rounded-2xl bg-white/6 p-3">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-white/55">Readiness</div>
                      <div className="mt-1 text-sm font-bold text-white">Live</div>
                    </div>
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
