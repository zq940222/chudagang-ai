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
    <section className="section-shell relative overflow-hidden px-8 py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="liquid-orb left-[16%] top-10 h-[24rem] w-[24rem] bg-accent-cyan/16" />
        <div className="liquid-orb right-[8%] bottom-[-3rem] h-[20rem] w-[20rem] bg-tertiary/14" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] liquid-glass-vivid liquid-panel liquid-float liquid-refract p-8 sm:p-12">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-6 text-4xl font-black tracking-[-0.04em] text-on-surface">{t("velocityTitle")}</h2>
          <p className="leading-8 text-on-surface-variant">{t("velocityDesc")}</p>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="rounded-[1.8rem] liquid-glass-vivid liquid-float p-6">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.2rem] liquid-glass-dark-vivid text-2xl font-black text-[color:var(--color-accent-gold)]">
                {step.num}
              </div>
              <h4 className="text-lg font-bold text-on-surface">{t(step.titleKey)}</h4>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">{t(step.descKey)}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl rounded-[2rem] liquid-glass-dark-vivid liquid-refract p-10 text-center">
          <h3 className="mb-4 text-2xl font-black text-white">{t("recruitTitle")}</h3>
          <p className="mx-auto mb-10 max-w-md text-sm leading-7 text-white/68">
            {t("recruitDesc")}
          </p>
          <Link
            href="/dashboard/developer/apply"
            className="inline-flex rounded-[1.4rem] bg-[linear-gradient(145deg,#f7f0e6,#dcc8ab)] px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-primary transition-all hover:scale-[1.02]"
          >
            {t("recruitCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
