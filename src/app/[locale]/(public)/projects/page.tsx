import { getTranslations } from "next-intl/server";
import { searchProjects } from "@/lib/actions/project";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectFilterSidebar } from "@/components/project/project-filter-sidebar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatCurrencyAmount } from "@/lib/currency";
import { getProjectCategoryLabel } from "@/lib/project-categories";
import type { ProjectSearchParams } from "@/types/project";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("projects");
  const params = await searchParams;

  const search: ProjectSearchParams = {
    query: typeof params.query === "string" ? params.query : undefined,
    skills: Array.isArray(params.skills)
      ? params.skills
      : typeof params.skills === "string"
        ? [params.skills]
        : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    minBudget: params.minBudget ? Number(params.minBudget) : undefined,
    maxBudget: params.maxBudget ? Number(params.maxBudget) : undefined,
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  const result = await searchProjects(search);
  const projects = result.data?.projects ?? [];
  const total = result.data?.total ?? 0;
  const featured = projects[0];
  const rest = projects.slice(1);

  return (
    <div className="flex min-h-screen">
      <ProjectFilterSidebar />

      <main className="flex-1 p-8 lg:p-12 max-w-7xl">
        <div className="mb-12">
          <Badge variant="accent" className="mb-4">
            {t("marketplaceBadge")}
          </Badge>
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-4 leading-tight">
            {t("title")}
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
            {t("description")}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {t("availableCount", { count: total })}
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="liquid-glass-vivid liquid-panel liquid-float rounded-[2rem] p-10 text-center">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] liquid-glass-dark-vivid text-[color:var(--color-accent-gold)]">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M3.75 12h10.5m-10.5 4.5h16.5" />
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
                  href="/dashboard/client/projects/new"
                  className="liquid-button rounded-[1.2rem] px-8 py-3 text-sm font-bold text-on-primary"
                >
                  {t("emptyPrimaryCta")}
                </Link>
                <Link
                  href="/developers"
                  className="liquid-glass-vivid liquid-float rounded-[1.2rem] px-8 py-3 text-sm font-bold text-on-surface"
                >
                  {t("emptySecondaryCta")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {featured && (
              <div className="lg:col-span-8">
                <Link href={`/projects/${featured.id}`} className="block group">
                  <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 shadow-sm hover:shadow-md transition-all h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                          </svg>
                        </span>
                        <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">
                          {getProjectCategoryLabel(featured.category, (key) => t(key)) ?? t("defaultCategory")}
                        </span>
                      </div>
                      {featured.budget !== null && (
                        <span className="text-secondary font-bold text-lg">
                          {formatCurrencyAmount(featured.budget, featured.currency)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-4 group-hover:text-secondary transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-on-surface-variant mb-8 leading-relaxed line-clamp-3">
                      {featured.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline">
                        {t("applicantCount", { count: featured.applicationCount })}
                      </Badge>
                      {featured.skills.slice(0, 3).map((s) => (
                        <Badge key={s.id}>{s.localeEn}</Badge>
                      ))}
                      <span className="ml-auto flex items-center gap-2 bg-primary-container text-on-primary px-6 py-2.5 rounded-lg text-sm font-bold">
                        {t("viewBrief")}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {rest[0] ? (
              <div className="lg:col-span-4">
                <ProjectCard project={rest[0]} variant="tall" />
              </div>
            ) : (
              <div className="lg:col-span-4 bg-primary-container text-on-primary rounded-xl p-8 flex flex-col justify-between min-h-[320px]">
                <div>
                  <h3 className="text-xl font-bold mb-4">{t("sideCtaTitle")}</h3>
                  <p className="text-on-primary-container text-sm leading-relaxed">
                    {t("sideCtaDescription")}
                  </p>
                </div>
                <Link
                  href="/dashboard/client/projects/new"
                  className="w-full bg-surface-container-lowest text-primary-container py-3 rounded-lg text-sm font-black text-center block"
                >
                  {t("sideCtaButton")}
                </Link>
              </div>
            )}

            {rest.slice(1).map((project) => (
              <div key={project.id} className="lg:col-span-6">
                <ProjectCard project={project} />
              </div>
            ))}

            <div className="lg:col-span-12 glass ghost-border rounded-xl p-12 text-center mt-6">
              <div className="max-w-xl mx-auto">
                <h3 className="text-2xl font-black tracking-tight mb-4">
                  {t("bottomCtaTitle")}
                </h3>
                <p className="text-on-surface-variant mb-8">
                  {t("bottomCtaDescription")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/dashboard/client/projects/new"
                    className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/10"
                  >
                    {t("bottomPrimaryCta")}
                  </Link>
                  <Link
                    href="/developers"
                    className="px-8 py-3 bg-surface-container-highest text-on-surface font-bold rounded-lg"
                  >
                    {t("bottomSecondaryCta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
