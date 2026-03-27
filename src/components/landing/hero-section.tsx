import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-surface-container-lowest py-24 px-8">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-cyan/5 blur-[120px]" />
        <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] rounded-full bg-tertiary/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Copy */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.25em] font-black bg-tertiary/10 text-tertiary px-4 py-1.5 rounded-full inline-block">
              {t("heroTagline")}
            </span>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-on-surface leading-[1.1]">
              {t("heroTitle")}{" "}
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                {t("heroHighlight")}
              </span>{" "}
              <br />
              {t("heroTitle2")}
            </h1>
            <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed pt-4">
              {t("heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/chat"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              {t("ctaStart")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-highest transition-all"
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>

        {/* Right: Visual card */}
        <div className="relative hidden lg:block">
          <div className="glass rounded-2xl shadow-2xl overflow-hidden ghost-border p-1.5">
            <div className="bg-gradient-to-br from-primary-container to-primary rounded-xl aspect-[4/3] flex items-end p-8 relative">
              {/* Abstract grid pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-6 grid-rows-4 h-full gap-2 p-4">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="rounded bg-white/20" />
                  ))}
                </div>
              </div>
              {/* Floating status card */}
              <div className="relative z-10 glass rounded-xl p-5 ghost-border shadow-xl w-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/80">Active Model Deployment</div>
                    <div className="text-sm font-bold text-on-surface">Fine-tuned Llama-3-70B</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-container/50 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-accent-cyan rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
