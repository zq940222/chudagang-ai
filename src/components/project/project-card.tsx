"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ProjectCardProps {
  project: ProjectCardData;
  variant?: "default" | "tall";
}

export function ProjectCard({ project, variant = "default" }: ProjectCardProps) {
  const locale = useLocale();
  const t = useTranslations("projects");

  const currencySymbol =
    project.currency === "CNY"
      ? "\u00A5"
      : project.currency === "EUR"
        ? "\u20AC"
        : "$";

  const displaySkills = project.skills.slice(0, 4);
  const extraSkillCount = project.skills.length - 4;
  const statusLabel = t(`status.${project.status}`);

  return (
    <Link href={`/projects/${project.id}`} className="block group h-full">
      <Card
        className={cn(
          "h-full transition-all hover:shadow-md hover:border-accent-cyan/20",
          variant === "tall" && "flex flex-col justify-between min-h-[320px]"
        )}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {project.category && (
                <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                  {project.category}
                </span>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                statusColors[project.status] ?? statusColors.DRAFT
              )}
            >
              {statusLabel}
            </span>
          </div>

          <h3 className="text-lg font-bold text-on-surface line-clamp-2 group-hover:text-secondary transition-colors">
            {project.title}
          </h3>

          <p className="mt-2 text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
            {project.description}
          </p>

          {displaySkills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {displaySkills.map((skill) => (
                <Badge key={skill.id} variant="default">
                  {locale === "zh" ? skill.localeZh : skill.localeEn}
                </Badge>
              ))}
              {extraSkillCount > 0 && (
                <Badge variant="outline">+{extraSkillCount}</Badge>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm pt-4 border-t border-outline-variant/10">
          <span className="font-bold text-on-surface">
            {project.budget !== null
              ? `${currencySymbol}${project.budget.toLocaleString()}`
              : t("negotiable")}
          </span>
          <span className="text-on-surface-variant text-xs">
            {t("applicantCount", { count: project.applicationCount })}
          </span>
        </div>
      </Card>
    </Link>
  );
}
