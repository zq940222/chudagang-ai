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
    achievementText:
      "Reduced inference latency by 45% for a Fortune 500 fintech deployment using custom quantization techniques.",
  },
  {
    name: "Elena Vance",
    handle: "@elena_cv",
    rate: 165,
    skills: ["YOLOv8", "TensorRT", "C++"],
    achievementKey: "expertExpertise",
    achievementText:
      "Built the primary visual navigation system for a major autonomous drone startup using custom CNN architectures.",
  },
];

export function FeaturedExperts({ t }: FeaturedExpertsProps) {
  return (
    <section className="py-24 px-8 mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-3xl font-black tracking-tight text-on-surface">
          {t("featuredExpertsTitle")}
        </h3>
        <div className="flex gap-2">
          <button className="w-12 h-12 liquid-glass-subtle liquid-panel rounded-full flex items-center justify-center hover:shadow-lg transition-all text-on-surface">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className="w-12 h-12 liquid-glass-subtle liquid-panel rounded-full flex items-center justify-center hover:shadow-lg transition-all text-on-surface">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {experts.map((expert) => (
          <div
            key={expert.name}
            className="liquid-glass liquid-panel liquid-shimmer p-8 rounded-3xl hover:shadow-2xl hover:shadow-primary/5 transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-surface-container overflow-hidden relative ring-4 ring-white/50">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold text-lg">
                    {expert.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-tertiary rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-on-tertiary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-xl text-on-surface">{expert.name}</h4>
                  <p className="text-xs text-on-surface-variant font-mono mt-1">
                    {expert.handle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-secondary">
                  ${expert.rate}
                  <span className="text-xs text-on-surface-variant font-normal">
                    /hr
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {expert.skills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>

            {/* Achievement */}
            <div className="liquid-glass-subtle rounded-2xl p-5 mb-8 ghost-border">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                <span>{t(expert.achievementKey)}</span>
                <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </div>
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                {expert.achievementText}
              </p>
            </div>

            {/* CTA */}
            <button className="liquid-button w-full rounded-2xl py-4 text-xs font-black uppercase tracking-widest text-on-primary transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
              {t("viewProfile")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
