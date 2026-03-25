import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const project = await db.project.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      client: { select: { id: true, name: true } },
      skills: { include: { skillTag: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!project) notFound();

  const currencySymbol =
    project.currency === "CNY"
      ? "\u00A5"
      : project.currency === "EUR"
        ? "\u20AC"
        : "$";

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-on-surface">
            {project.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            {project.client.name && (
              <span>Posted by {project.client.name}</span>
            )}
            <span>
              {project._count.applications} application
              {project._count.applications !== 1 ? "s" : ""}
            </span>
            {project.budget !== null && (
              <span className="font-medium text-on-surface">
                Budget: {currencySymbol}
                {Number(project.budget).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/chat`}>Apply</Link>
        </Button>
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-on-surface">Description</h2>
        <p className="mt-2 whitespace-pre-line text-on-surface-variant">
          {project.description}
        </p>
      </div>

      {/* AI Summary */}
      {project.aiSummary && (
        <div className="mt-8 rounded-xl bg-primary/5 p-5 ghost-border">
          <h2 className="text-lg font-semibold text-on-surface">AI Summary</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {project.aiSummary}
          </p>
        </div>
      )}

      {/* Required Skills */}
      {project.skills.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-on-surface">
            Required Skills
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.skills.map((s) => (
              <span
                key={s.skillTag.id}
                className="rounded-full bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant"
              >
                {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
