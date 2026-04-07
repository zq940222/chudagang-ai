import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { searchDevelopers } from "@/lib/services/matching";
import { DeveloperCard } from "@/components/developer/developer-card";
import { DeveloperFilterSidebar } from "@/components/developer/developer-filter-sidebar";
import { ExpertMatchChat } from "@/components/developer/expert-match-chat";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAmount } from "@/lib/currency";
import type { DeveloperSearchParams } from "@/types/developer";
import type { DeveloperCardData } from "@/types/developer";

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("developers");
  const locale = await getLocale();
  const params = await searchParams;

  const search: DeveloperSearchParams = {
    query: typeof params.query === "string" ? params.query : undefined,
    skills: Array.isArray(params.skills)
      ? params.skills
      : typeof params.skills === "string"
        ? [params.skills]
        : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    minRate: params.minRate ? Number(params.minRate) : undefined,
    maxRate: params.maxRate ? Number(params.maxRate) : undefined,
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  const { developers, total } = await searchDevelopers(search);
  const featured = developers[0];
  const rest = developers.slice(1);
  const featuredLabels = {
    verified: t("verifiedExpert"),
    viewProfile: t("viewProfile"),
    portfolio: t("portfolio"),
    rateStartsAt: t("rateStartsAt"),
    perHour: t("perHour"),
  };

  return (
    <div className="flex min-h-screen">
      <DeveloperFilterSidebar />

      <main className="flex-1 min-w-0">
        {/* AI Chat — hero area */}
        <section className="border-b border-outline-variant/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))]">
          <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12 lg:py-10">
            <div className="mb-6 text-center">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
                <Badge variant="accent">{t("marketplaceBadge")}</Badge>
                <Badge variant="dark">{t("verifiedBadge")}</Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-on-surface sm:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {t("description")}
              </p>
            </div>
            <div className="h-[420px] rounded-2xl glass ghost-border overflow-hidden">
              <ExpertMatchChat />
            </div>
          </div>
        </section>

        {/* Expert cards below */}
        <section className="p-8 lg:p-12">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-on-surface">
              {t("allExperts")}
            </h2>
            <span className="text-sm font-medium text-on-surface-variant">
              {t("availableCount", { count: total })}
            </span>
          </div>

          {developers.length === 0 ? (
            <div className="liquid-glass-vivid liquid-panel liquid-float rounded-[2rem] p-10 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] liquid-glass-dark-vivid text-[color:var(--color-accent-gold)]">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5m5.25-5.25H6.75" />
                  </svg>
                </div>
                <h2 className="mb-3 text-2xl font-black tracking-tight text-on-surface">
                  {t("emptyTitle")}
                </h2>
                <p className="mb-8 text-base leading-8 text-on-surface-variant">
                  {t("emptyDescription")}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/chat"
                    className="liquid-button rounded-[1.2rem] px-8 py-3 text-sm font-bold text-on-primary"
                  >
                    {t("emptyPrimaryCta")}
                  </Link>
                  <Link
                    href="/projects"
                    className="liquid-glass-vivid liquid-float rounded-[1.2rem] px-8 py-3 text-sm font-bold text-on-surface"
                  >
                    {t("emptySecondaryCta")}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {featured && (
                <div className="md:col-span-2 xl:col-span-3">
                  <FeaturedDeveloperCard developer={featured} locale={locale} labels={featuredLabels} />
                </div>
              )}

              {rest.map((dev) => (
                <DeveloperCard key={dev.id} developer={dev} />
              ))}
            </div>
          )}

          {total > 12 && (
            <div className="mt-20 flex items-center justify-center gap-4">
              <div className="flex gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-on-primary">
                  1
                </span>
                <span className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg font-bold hover:bg-surface-container-high text-xs">
                  2
                </span>
                <span className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg font-bold hover:bg-surface-container-high text-xs">
                  3
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FeaturedDeveloperCard({
  developer,
  locale,
  labels,
}: {
  developer: DeveloperCardData;
  locale: string;
  labels: {
    verified: string;
    viewProfile: string;
    portfolio: string;
    rateStartsAt: string;
    perHour: string;
  };
}) {
  const initial = developer.displayName.charAt(0).toUpperCase();
  const displayRate = formatCurrencyAmount(developer.hourlyRate ?? 0, developer.currency);

  return (
    <Link href={`/developers/${developer.id}`} className="group block">
      <div className="glass flex flex-col gap-8 rounded-xl bg-gradient-to-br from-surface-container-lowest to-accent-cyan/5 p-8 ghost-border md:flex-row">
        <div className="flex flex-col items-center md:w-1/4">
          <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-container to-primary text-4xl font-black text-on-primary">
            {initial}
          </div>
          {developer.aiRating !== null && (
            <div className="flex items-center gap-1 text-2xl font-black text-secondary">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
              </svg>
              {developer.aiRating.toFixed(1)}
            </div>
          )}
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {labels.verified}
          </p>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-on-surface">
                {developer.displayName}
              </h3>
              {developer.title && (
                <p className="text-sm font-bold tracking-tight text-secondary">
                  {developer.title}
                </p>
              )}
            </div>
            {developer.hourlyRate !== null && (
              <div className="text-right">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {labels.rateStartsAt}
                </span>
                <span className="text-2xl font-black text-on-surface">
                  {displayRate}
                  <span className="text-sm font-normal text-on-surface-variant">{labels.perHour}</span>
                </span>
              </div>
            )}
          </div>

          {developer.bio && (
            <p className="mb-6 leading-relaxed text-on-surface-variant line-clamp-3">
              {developer.bio}
            </p>
          )}

          <div className="mb-8 flex flex-wrap gap-3">
            {developer.skills.slice(0, 5).map((skill) => (
              <Badge key={skill.id} variant="dark">
                {locale === "zh" ? skill.localeZh : skill.localeEn}
              </Badge>
            ))}
          </div>

          <div className="mt-auto flex gap-4">
            <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-primary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
              {labels.viewProfile}
            </span>
            <span className="rounded-xl border border-outline-variant/20 px-6 py-3 text-xs font-bold uppercase tracking-widest">
              {labels.portfolio}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
