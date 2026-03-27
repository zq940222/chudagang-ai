import { Link } from "@/i18n/navigation";

interface VelocityCtaProps {
  t: (key: string) => string;
}

const steps = [
  { num: "01", titleKey: "velStep1Title", descKey: "velStep1Desc" },
  { num: "02", titleKey: "velStep2Title", descKey: "velStep2Desc" },
  { num: "03", titleKey: "velStep3Title", descKey: "velStep3Desc" },
  { num: "04", titleKey: "velStep4Title", descKey: "velStep4Desc" },
];

export function VelocityCta({ t }: VelocityCtaProps) {
  return (
    <section className="py-24 bg-primary-container text-on-primary overflow-hidden relative">
      <div className="mx-auto max-w-6xl px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-black mb-6">{t("velocityTitle")}</h2>
          <p className="text-on-primary-container leading-relaxed">
            {t("velocityDesc")}
          </p>
        </div>

        {/* 4 Steps */}
        <div className="grid md:grid-cols-4 gap-8 relative mb-24">
          {steps.map((step) => (
            <div key={step.num} className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-accent-cyan">
                {step.num}
              </div>
              <h4 className="text-lg font-bold">{t(step.titleKey)}</h4>
              <p className="text-xs text-on-primary-container leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Recruitment CTA */}
        <div className="p-12 glass rounded-3xl ghost-border text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-black mb-4 text-on-surface">
            {t("recruitTitle")}
          </h3>
          <p className="text-on-surface-variant mb-10 text-sm max-w-md mx-auto leading-relaxed">
            {t("recruitDesc")}
          </p>
          <Link
            href="/register"
            className="inline-flex px-10 py-4 bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            {t("recruitCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
