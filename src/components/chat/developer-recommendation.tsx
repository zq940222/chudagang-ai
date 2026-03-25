"use client";

import { cn } from "@/lib/utils";

interface Developer {
  id: string;
  name: string;
  title?: string;
  skills?: string[];
  rating?: number;
  hourlyRate?: number;
}

interface DeveloperRecommendationsProps {
  developers: Developer[];
  className?: string;
}

export function DeveloperRecommendations({
  developers,
  className,
}: DeveloperRecommendationsProps) {
  if (!developers?.length) return null;

  return (
    <div className={cn("space-y-3 my-2", className)}>
      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
        Recommended Developers
      </p>
      {developers.map((dev, index) => (
        <a
          key={dev.id}
          href={`/developers/${dev.id}`}
          className="flex items-start gap-3 rounded-lg bg-surface-container-lowest ghost-border p-3 hover:bg-surface-container-high transition-colors"
        >
          {/* Rank badge */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-on-surface truncate">
                {dev.name}
              </span>
              {dev.rating != null && (
                <span className="text-xs text-on-surface-variant">
                  {dev.rating.toFixed(1)}
                </span>
              )}
            </div>

            {dev.title && (
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                {dev.title}
              </p>
            )}

            {dev.skills?.length ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {dev.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-md bg-surface-container-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {dev.hourlyRate != null && (
            <span className="flex-shrink-0 text-xs font-medium text-accent-cyan">
              ${dev.hourlyRate}/hr
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
