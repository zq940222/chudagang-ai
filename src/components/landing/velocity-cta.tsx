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
    <section className="relative overflow-hidden bg-primary-container py-24 text-on-primary">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[20%] top-[-20%] h-[500px] w-[500px] rounded-full bg-accent-cyan/8 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-tertiary/6 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-8">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <h2 className="mb-6 text-4xl font-black">{t("velocityTitle")}</h2>
          <p className="leading-relaxed text-white/70">{t("velocityDesc")}</p>
        </div>

        <div className="relative mb-24 grid gap-8 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="space-y-6 rounded-3xl liquid-glass-subtle p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl liquid-glass-dark text-2xl font-black text-accent-cyan">
                {step.num}
              </div>
              <h4 className="text-lg font-bold text-white">{t(step.titleKey)}</h4>
              <p className="text-sm leading-relaxed text-white/60">{t(step.descKey)}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl rounded-3xl liquid-glass liquid-panel p-12 text-center">
          <h3 className="mb-4 text-2xl font-black text-on-surface">{t("recruitTitle")}</h3>
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-on-surface-variant">
            {t("recruitDesc")}
          </p>
          <Link
            href="/register"
            className="liquid-button inline-flex rounded-2xl px-10 py-4 text-xs font-black uppercase tracking-widest text-on-primary transition-all hover:scale-105"
          >
            {t("recruitCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
