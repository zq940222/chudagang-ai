import { SectionHeader } from "@/components/ui/section-header";

interface CategoriesBentoProps {
  t: (key: string) => string;
}

export function CategoriesBento({ t }: CategoriesBentoProps) {
  return (
    <section className="section-shell mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <div className="relative z-10">
        <SectionHeader
          tagline={t("featuresTagline")}
          title={t("featuresTitle")}
          description={t("featuresDesc")}
          align="left"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="group relative min-h-[320px] overflow-hidden rounded-[2rem] md:col-span-8 liquid-glass-dark p-10 text-on-primary">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(154,215,207,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(207,180,137,0.12),transparent_26%)]" />
            <div className="absolute inset-0 liquid-mesh opacity-15" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                  <svg className="h-6 w-6 text-[color:var(--color-accent-gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-3xl font-bold">{t("catLlmTitle")}</h3>
                <p className="max-w-sm leading-7 text-white/72">{t("catLlmDesc")}</p>
              </div>
              <div className="flex gap-3 pt-6">
                <span className="rounded-full bg-white/8 px-4 py-2 text-xs font-mono text-white/84">PyTorch</span>
                <span className="rounded-full bg-white/8 px-4 py-2 text-xs font-mono text-white/84">Hugging Face</span>
              </div>
            </div>
          </div>

          <div className="min-h-[320px] rounded-[2rem] md:col-span-4 liquid-glass liquid-panel p-8">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-on-surface">{t("catCvTitle")}</h3>
                <p className="text-sm leading-7 text-on-surface-variant">{t("catCvDesc")}</p>
              </div>
              <div className="mt-6 h-32 rounded-[1.5rem] bg-[radial-gradient(circle_at_18%_18%,rgba(154,215,207,0.34),transparent_24%),linear-gradient(145deg,rgba(255,255,255,0.82),rgba(238,231,221,0.44))]" />
            </div>
          </div>

          <div className="min-h-[320px] rounded-[2rem] md:col-span-4 liquid-glass liquid-panel p-8">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(190,164,181,0.18)]">
                  <svg className="h-6 w-6 text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-on-surface">{t("catNeuralTitle")}</h3>
                <p className="text-sm leading-7 text-on-surface-variant">{t("catNeuralDesc")}</p>
              </div>
              <button className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/55 text-on-surface shadow-[0_10px_24px_rgba(78,72,64,0.08)] transition-all group-hover:bg-primary group-hover:text-on-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-[320px] rounded-[2rem] md:col-span-8 liquid-glass liquid-panel p-10">
            <div className="flex h-full flex-col gap-10 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(154,215,207,0.18)]">
                  <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-3xl font-bold text-on-surface">{t("catDeployTitle")}</h3>
                <p className="leading-7 text-on-surface-variant">{t("catDeployDesc")}</p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4">
                <div className="h-32 rounded-[1.5rem] bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.68),transparent_26%),linear-gradient(145deg,rgba(255,252,247,0.88),rgba(223,214,199,0.46))]" />
                <div className="h-32 rounded-[1.5rem] bg-[radial-gradient(circle_at_22%_20%,rgba(190,164,181,0.28),transparent_24%),linear-gradient(145deg,rgba(255,255,255,0.74),rgba(232,224,214,0.42))]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
