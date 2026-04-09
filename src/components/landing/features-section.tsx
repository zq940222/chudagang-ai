interface FeaturesSectionProps {
  t: (key: string) => string;
}

const features = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    titleKey: "featureAiTitle",
    descKey: "featureAiDesc",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    titleKey: "featureMatchTitle",
    descKey: "featureMatchDesc",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    titleKey: "featureSecureTitle",
    descKey: "featureSecureDesc",
  },
];

export function FeaturesSection({ t }: FeaturesSectionProps) {
  return (
    <section className="section-shell relative mx-auto max-w-7xl px-6 py-24 sm:py-28">
      <div className="relative z-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <span className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-on-surface-variant">
            {t("featuresTagline")}
          </span>
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.04em] text-on-surface sm:text-5xl">
            {t("featuresTitle")}
          </h2>
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group relative rounded-[2rem] liquid-glass liquid-panel p-8 transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(74,65,57,0.08)]"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%)] opacity-80" />
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[rgba(255,255,255,0.56)] text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-colors group-hover:bg-primary group-hover:text-on-primary">
                {feature.icon}
              </div>
              <h3 className="relative z-10 mt-6 text-xl font-bold text-on-surface">
                {t(feature.titleKey)}
              </h3>
              <p className="relative z-10 mt-3 text-base leading-7 text-on-surface-variant">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
