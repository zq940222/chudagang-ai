import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

interface Expert {
  id: string;
  userId: string;
  displayName: string;
  title: string | null;
  hourlyRate: number | null;
  currency: string;
  aiRating: number | null;
  skills: string[];
}

interface FeaturedExpertsProps {
  t: (key: string) => string;
  experts: Expert[];
  locale: string;
}

// Fallback static data when DB has no approved developers
const fallbackExperts: Expert[] = [
  {
    id: "static-1",
    userId: "static-1",
    displayName: "Dr. Aris Thorne",
    title: "LLM Research Engineer",
    hourlyRate: 180,
    currency: "USD",
    aiRating: 4.8,
    skills: ["Llama-3", "RLHF", "PyTorch"],
  },
  {
    id: "static-2",
    userId: "static-2",
    displayName: "Elena Vance",
    title: "Computer Vision Engineer",
    hourlyRate: 165,
    currency: "USD",
    aiRating: 4.6,
    skills: ["YOLOv8", "TensorRT", "C++"],
  },
];

const avatarGradients = [
  "bg-[linear-gradient(145deg,#1b2635,#45566d)]",
  "bg-[linear-gradient(145deg,#6b5b64,#2d394b)]",
  "bg-[linear-gradient(145deg,#3d4f3a,#2a3d4d)]",
  "bg-[linear-gradient(145deg,#5a3f4e,#2d3548)]",
];

export function FeaturedExperts({ t, experts, locale }: FeaturedExpertsProps) {
  const displayExperts = experts.length > 0 ? experts : fallbackExperts;

  return (
    <section className="section-shell mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <div className="relative z-10">
        <div className="mb-12 flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-[-0.04em] text-on-surface">
            {t("featuredExpertsTitle")}
          </h3>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {displayExperts.map((expert, index) => {
            const currencySymbol = expert.currency === "CNY" ? "¥" : "$";
            const isStatic = expert.id.startsWith("static-");

            return (
              <div
                key={expert.id}
                className="group rounded-[2rem] liquid-glass-vivid liquid-panel liquid-float liquid-refract p-8 transition-all hover:-translate-y-1 hover:shadow-[0_34px_72px_rgba(74,65,57,0.1)]"
              >
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="relative h-16 w-16 ring-4 ring-white/45 rounded-full">
                      <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full text-lg font-bold text-on-primary ${avatarGradients[index % avatarGradients.length]}`}>
                        {expert.displayName.charAt(0)}
                      </div>
                      {expert.aiRating && expert.aiRating >= 3.5 && (
                        <div className="absolute -bottom-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[color:var(--color-accent-gold)] text-[color:var(--color-primary)] shadow-[0_4px_10px_rgba(31,34,39,0.16)]">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-on-surface">{expert.displayName}</h4>
                      {expert.title && (
                        <p className="mt-1 text-xs text-on-surface-variant">{expert.title}</p>
                      )}
                    </div>
                  </div>
                  {expert.hourlyRate && (
                    <div className="text-right">
                      <div className="text-2xl font-black tracking-tight text-secondary">
                        {currencySymbol}{expert.hourlyRate}
                        <span className="text-xs font-normal text-on-surface-variant">{t("rateSuffix")}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-8 flex flex-wrap gap-2">
                  {expert.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>

                {expert.aiRating && (
                  <div className="mb-8 rounded-[1.5rem] liquid-glass-vivid p-5 ghost-border">
                    <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                      <span>AI {locale === "zh" ? "评分" : "Rating"}</span>
                      <span className="text-base font-black text-secondary">{expert.aiRating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#d4b185_0%,#93d0c7_100%)]"
                        style={{ width: `${(expert.aiRating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isStatic ? (
                  <Link
                    href={`/developers/${expert.userId}`}
                    className="liquid-button block w-full rounded-[1.4rem] py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-on-primary transition-all group-hover:shadow-lg"
                  >
                    {t("viewProfile")}
                  </Link>
                ) : (
                  <button className="liquid-button w-full rounded-[1.4rem] py-4 text-xs font-black uppercase tracking-[0.2em] text-on-primary transition-all group-hover:shadow-lg">
                    {t("viewProfile")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
