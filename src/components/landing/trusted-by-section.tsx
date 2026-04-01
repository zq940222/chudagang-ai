interface TrustedBySectionProps {
  t: (key: string) => string;
}

const logos = [
  { name: "NEURAL", highlight: "X" },
  { name: "CYBER", highlight: "FLOW" },
  { name: "SYNTH", highlight: "OS" },
  { name: "VIRTUE", highlight: "AI" },
  { name: "PROTO", highlight: "TYPE" },
];

export function TrustedBySection({ t }: TrustedBySectionProps) {
  return (
    <section className="px-8 py-10">
      <div className="mx-auto max-w-6xl px-8">
        <div className="liquid-glass-subtle liquid-panel rounded-[2rem] px-6 py-8">
          <p className="mb-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant">
            {t("trustedByTagline")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-55 grayscale transition-all duration-500 hover:opacity-80 hover:grayscale-0 md:gap-20">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="flex select-none items-center gap-0.5 text-xl font-black tracking-tighter text-on-surface"
              >
                {logo.name}
                <span className="text-secondary">{logo.highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
