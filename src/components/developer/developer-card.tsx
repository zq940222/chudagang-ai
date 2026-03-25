"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import type { DeveloperCardData } from "@/types/developer";

export function DeveloperCard({ developer }: { developer: DeveloperCardData }) {
  const locale = useLocale();

  const initial = developer.displayName.charAt(0).toUpperCase();
  const skillsToShow = developer.skills.slice(0, 5);
  const hasMore = developer.skills.length > 5;

  return (
    <Link href={`/developers/${developer.id}`} className="block group">
      <Card className="h-full transition-all hover:ring-1 hover:ring-accent-cyan/40">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-on-surface group-hover:text-accent-cyan transition-colors">
              {developer.displayName}
            </h3>
            {developer.title && (
              <p className="truncate text-sm text-on-surface-variant">
                {developer.title}
              </p>
            )}
          </div>

          {/* Rating */}
          {developer.aiRating !== null && (
            <span className="shrink-0 rounded-md bg-accent-cyan/10 px-2 py-0.5 text-xs font-semibold text-accent-cyan">
              {developer.aiRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Bio */}
        {developer.bio && (
          <p className="mt-3 text-sm text-on-surface-variant line-clamp-2">
            {developer.bio}
          </p>
        )}

        {/* Skills */}
        {skillsToShow.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skillsToShow.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant"
              >
                {locale === "zh" ? skill.localeZh : skill.localeEn}
              </span>
            ))}
            {hasMore && (
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant/60">
                +{developer.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Rate */}
        {developer.hourlyRate !== null && (
          <p className="mt-3 text-sm font-medium text-on-surface">
            {developer.currency === "CNY" ? "\u00A5" : developer.currency === "EUR" ? "\u20AC" : "$"}
            {developer.hourlyRate}
            <span className="text-on-surface-variant font-normal">/hr</span>
          </p>
        )}
      </Card>
    </Link>
  );
}
