import { SectionHeader } from "@/components/ui/section-header";

interface CategoriesBentoProps {
  t: (key: string) => string;
}

export function CategoriesBento({ t }: CategoriesBentoProps) {
  return (
    <section className="py-24 px-8 mx-auto max-w-6xl">
      <SectionHeader
        tagline={t("featuresTagline")}
        title={t("featuresTitle")}
        description={t("featuresDesc")}
        align="left"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LLM Fine-tuning - Large card */}
        <div className="md:col-span-8 bg-primary-container rounded-2xl p-10 flex flex-col justify-between text-on-primary relative overflow-hidden group min-h-[320px]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-cyan/10 blur-[100px] group-hover:bg-accent-cyan/20 transition-all" />
          <div className="relative z-10">
            <svg className="w-10 h-10 text-accent-cyan mb-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            <h3 className="text-3xl font-bold mb-4">{t("catLlmTitle")}</h3>
            <p className="text-on-primary-container max-w-sm leading-relaxed">{t("catLlmDesc")}</p>
          </div>
          <div className="flex gap-4 relative z-10 mt-6">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">PyTorch</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">Hugging Face</span>
          </div>
        </div>

        {/* Computer Vision - Medium card */}
        <div className="md:col-span-4 bg-surface-container-low rounded-2xl p-8 flex flex-col justify-between ghost-border group min-h-[320px]">
          <div>
            <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h3 className="text-2xl font-bold mb-3">{t("catCvTitle")}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">{t("catCvDesc")}</p>
          </div>
          <div className="w-full h-32 rounded-xl overflow-hidden mt-6 bg-gradient-to-br from-surface-container to-surface-container-high" />
        </div>

        {/* Neural Architecture - Medium card */}
        <div className="md:col-span-4 bg-surface-container-lowest shadow-xl shadow-surface-dim/30 rounded-2xl p-8 flex flex-col justify-between ghost-border group min-h-[320px]">
          <div>
            <svg className="w-10 h-10 text-tertiary mb-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <h3 className="text-2xl font-bold mb-3">{t("catNeuralTitle")}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">{t("catNeuralDesc")}</p>
          </div>
          <button className="mt-6 w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* AI Deployment - Large card */}
        <div className="md:col-span-8 bg-accent-cyan/10 rounded-2xl p-10 flex flex-col md:flex-row gap-10 items-center border border-accent-cyan/10 min-h-[320px]">
          <div className="flex-1">
            <svg className="w-10 h-10 text-secondary mb-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            <h3 className="text-3xl font-bold mb-4 text-on-surface">{t("catDeployTitle")}</h3>
            <p className="text-on-surface-variant leading-relaxed">{t("catDeployDesc")}</p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="h-32 bg-surface-container-lowest/60 rounded-xl ghost-border" />
            <div className="h-32 bg-surface-container-lowest/60 rounded-xl ghost-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
