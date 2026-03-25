"use client";

import { cn } from "@/lib/utils";

interface ProjectSummary {
  title: string;
  description: string;
  skills: string[];
  budget?: number | null;
  timeline?: string | null;
  category?: string | null;
}

interface ProjectSummaryCardProps {
  project: ProjectSummary;
  className?: string;
}

export function ProjectSummaryCard({
  project,
  className,
}: ProjectSummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container-lowest ghost-border p-4 my-2 space-y-3",
        className
      )}
    >
      <div>
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1">
          Project Summary
        </p>
        <h4 className="text-base font-semibold text-on-surface">
          {project.title}
        </h4>
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed">
        {project.description}
      </p>

      {/* Skills */}
      {project.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
        {project.budget != null && (
          <span>
            Budget: <strong className="text-on-surface">${project.budget.toLocaleString()}</strong>
          </span>
        )}
        {project.timeline && (
          <span>
            Timeline: <strong className="text-on-surface">{project.timeline}</strong>
          </span>
        )}
        {project.category && (
          <span>
            Category: <strong className="text-on-surface">{project.category}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
