interface HowItWorksSectionProps {
  t: (key: string) => string;
}

const steps = [
  { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
  { num: "04", titleKey: "step4Title", descKey: "step4Desc" },
];

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold text-on-surface sm:text-3xl">
        {t("howTitle")}
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.num} className="relative rounded-xl bg-surface-container-low p-6 ghost-border">
            <span className="text-3xl font-bold text-accent-cyan/20">{step.num}</span>
            <h3 className="mt-2 text-base font-semibold text-on-surface">
              {t(step.titleKey)}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t(step.descKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
