import { Badge } from "@/components/ui/badge";

interface FeaturedExpertsProps {
  t: (key: string) => string;
}

const experts = [
  {
    name: "Dr. Aris Thorne",
    handle: "@aris_neural",
    rate: 180,
    skills: ["Llama-3", "RLHF", "PyTorch"],
    achievementKey: "expertAchievement",
    achievementTextKey: "expertArisAchievementText",
  },
  {
    name: "Elena Vance",
    handle: "@elena_cv",
    rate: 165,
    skills: ["YOLOv8", "TensorRT", "C++"],
    achievementKey: "expertExpertise",
    achievementTextKey: "expertElenaAchievementText",
  },
];

export function FeaturedExperts({ t }: FeaturedExpertsProps) {
  return (
    <section className="section-shell mx-auto max-w-6xl px-8 py-24">
      <div className="relative z-10">
        <div className="mb-12 flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-[-0.04em] text-on-surface">
            {t("featuredExpertsTitle")}
          </h3>
          <div className="flex gap-2">
            <button className="flex h-12 w-12 items-center justify-center rounded-full liquid-glass-vivid liquid-float text-on-surface transition-all hover:shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full liquid-glass-vivid liquid-float text-on-surface transition-all hover:shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {experts.map((expert, index) => (
            <div
              key={expert.name}
              className="group rounded-[2rem] liquid-glass-vivid liquid-panel liquid-float liquid-refract p-8 transition-all hover:-translate-y-1 hover:shadow-[0_34px_72px_rgba(74,65,57,0.1)]"
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative h-16 w-16 ring-4 ring-white/45 rounded-full">
                    <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full text-lg font-bold text-on-primary ${index === 0 ? "bg-[linear-gradient(145deg,#1b2635,#45566d)]" : "bg-[linear-gradient(145deg,#6b5b64,#2d394b)]"}`}>
                      {expert.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[color:var(--color-accent-gold)] text-[color:var(--color-primary)] shadow-[0_4px_10px_rgba(31,34,39,0.16)]">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-on-surface">{expert.name}</h4>
                    <p className="mt-1 font-mono text-xs text-on-surface-variant">{expert.handle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-secondary">
                    ${expert.rate}
                    <span className="text-xs font-normal text-on-surface-variant">{t("rateSuffix")}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8 flex flex-wrap gap-2">
                {expert.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>

              <div className="mb-8 rounded-[1.5rem] liquid-glass-vivid p-5 ghost-border">
                <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  <span>{t(expert.achievementKey)}</span>
                  <svg className="w-4 h-4 text-[color:var(--color-accent-gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                </div>
                <p className="text-sm leading-7 text-on-surface">{t(expert.achievementTextKey)}</p>
              </div>

              <button className="liquid-button w-full rounded-[1.4rem] py-4 text-xs font-black uppercase tracking-[0.2em] text-on-primary transition-all group-hover:shadow-lg">
                {t("viewProfile")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
