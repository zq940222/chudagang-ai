"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectCardData } from "@/types/project";

const statusColors: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  PUBLISHED: "bg-accent-cyan/10 text-accent-cyan",
  IN_PROGRESS: "bg-primary/10 text-primary",
  DELIVERED: "bg-accent-cyan/20 text-accent-cyan",
  COMPLETED: "bg-primary/20 text-primary",
  CANCELLED: "bg-error/10 text-error",
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const locale = useLocale();

  const currencySymbol =
    project.currency === "CNY"
      ? "\u00A5"
      : project.currency === "EUR"
        ? "\u20AC"
        : "$";

  const displaySkills = project.skills.slice(0, 4);
  const extraSkillCount = project.skills.length - 4;

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-surface-container-low">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-on-surface line-clamp-1">
            {project.title}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              statusColors[project.status] ?? statusColors.DRAFT
            )}
          >
            {project.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">
          {project.description}
        </p>

        {displaySkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant"
              >
                {locale === "zh" ? skill.localeZh : skill.localeEn}
              </span>
            ))}
            {extraSkillCount > 0 && (
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant/70">
                +{extraSkillCount}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium text-on-surface">
            {project.budget !== null
              ? `${currencySymbol}${project.budget.toLocaleString()}`
              : "Negotiable"}
          </span>
          <span className="text-on-surface-variant">
            {project.applicationCount} application
            {project.applicationCount !== 1 ? "s" : ""}
          </span>
        </div>
      </Card>
    </Link>
  );
}
