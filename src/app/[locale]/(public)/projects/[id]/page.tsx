import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { ApplicationForm } from "@/components/application/application-form";
import { formatCurrencyAmount } from "@/lib/currency";
import { getProjectCategoryLabel } from "@/lib/project-categories";
import { getTranslations } from "next-intl/server";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("projectDetail");
  const tProjects = await getTranslations("projects");

  const session = await auth();

  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      skills: { include: { skillTag: true } },
      _count: { select: { applications: true } },
    },
  });

  // Allow project owner to view any status; others can only see PUBLISHED
  if (!project || (project.status !== "PUBLISHED" && project.clientId !== session?.user?.id)) {
    notFound();
  }
  const hasDeveloperProfile = session?.user?.id
    ? !!(await db.developerProfile.findUnique({
        where: { userId: session.user.id },
      }))
    : false;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-16">
      {/* Main Content */}
      <div className="flex-1 space-y-12">
        {/* Hero Header */}
        <section className="space-y-6">
          <Badge variant="accent">{t("activeListing")}</Badge>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface leading-tight max-w-3xl">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-8 py-2">
            {project.budget !== null && (
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-1">
                  {t("budget")}
                </span>
                <span className="text-2xl font-bold text-secondary">
                  {formatCurrencyAmount(Number(project.budget), project.currency)}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-1">
                {t("applicants")}
              </span>
              <span className="text-2xl font-bold text-on-surface">
                {project._count.applications}
              </span>
            </div>
            {project.category && (
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-1">
                  {t("category")}
                </span>
                <span className="text-2xl font-bold text-on-surface">
                  {getProjectCategoryLabel(project.category, tProjects) ?? project.category}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Project Overview */}
        <section className="space-y-8">
          <div className="bg-surface-container-low p-8 rounded-xl ghost-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              {t("overview")}
            </h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* AI Summary */}
          {project.aiSummary && (
            <div className="bg-accent-cyan/5 p-8 rounded-xl border border-accent-cyan/10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                {t("aiAnalysis")}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {project.aiSummary}
              </p>
            </div>
          )}

          {/* Technical Requirements */}
          {project.skills.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{t("techRequirements")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.skills.map((s) => (
                  <div
                    key={s.skillTag.id}
                    className="bg-surface-container-highest p-6 rounded-xl ghost-border"
                  >
                    <span className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                      </svg>
                    </span>
                    <h4 className="font-bold mb-1">
                      {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      {s.skillTag.category || t("requiredSkill")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-[380px] space-y-8">
        <div className="bg-surface-container-lowest p-8 rounded-xl ghost-border shadow-sm sticky top-28">
          {/* Apply CTA */}
          {hasDeveloperProfile ? (
            <div className="mb-6">
              <ApplicationForm projectId={project.id} />
            </div>
          ) : (
            <Button
              className="w-full py-4 text-lg font-bold mb-6"
              asChild
            >
              <Link href={`/${locale}/login`}>
                {session?.user ? t("createProfile") : t("signInToApply")}
              </Link>
            </Button>
          )}

          {/* Client Info */}
          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10 pb-2">
              {t("clientInfo")}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div>
                <div className="font-bold">
                  {project.client.name || t("anonymousClient")}
                </div>
                <div className="text-xs text-on-surface-variant">{t("projectOwner")}</div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">{t("status")}</span>
                <Badge variant="status">{project.status}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">{t("applications")}</span>
                <span className="font-bold">{project._count.applications}</span>
              </div>
              {project.budget !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">{t("budget")}</span>
                  <span className="font-bold text-secondary">
                    {formatCurrencyAmount(Number(project.budget), project.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-12 p-6 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest">{t("expertTip")}</span>
            </div>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {t("tipContent")}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
