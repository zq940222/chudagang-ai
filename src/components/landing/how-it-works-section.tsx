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
    <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-3xl font-extrabold text-on-surface sm:text-5xl">
          {t("howTitle")}
        </h2>
      </div>
      
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div 
            key={step.num} 
            className="group relative flex flex-col items-start rounded-3xl bg-surface-container p-8 transition-all hover:bg-surface-container-high ghost-border"
          >
            {/* Connection line for desktop */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-outline-variant/30 z-0" />
            )}
            
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary text-lg font-black shadow-lg mb-6 group-hover:scale-110 transition-transform">
              {step.num}
            </div>
            
            <h3 className="relative z-10 text-lg font-bold text-on-surface">
              {t(step.titleKey)}
            </h3>
            <p className="relative z-10 mt-3 text-sm leading-relaxed text-on-surface-variant/80">
              {t(step.descKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
