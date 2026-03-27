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
    <section className="py-16 bg-surface-container-low/40 border-y border-outline-variant/10">
      <div className="mx-auto max-w-6xl px-8">
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-outline font-black mb-10">
          {t("trustedByTagline")}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-500">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-0.5 font-black text-xl tracking-tighter text-on-surface select-none"
            >
              {logo.name}
              <span className="text-secondary">{logo.highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
