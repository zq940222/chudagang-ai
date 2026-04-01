"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAmount } from "@/lib/currency";
import type { DeveloperCardData } from "@/types/developer";

export function DeveloperCard({ developer }: { developer: DeveloperCardData }) {
  const locale = useLocale();
  const t = useTranslations("developers");

  const initial = developer.displayName.charAt(0).toUpperCase();
  const skillsToShow = developer.skills.slice(0, 5);
  const hasMore = developer.skills.length > 5;

  return (
    <Link href={`/developers/${developer.id}`} className="block group h-full">
      <div className="glass rounded-xl p-6 ghost-border hover:ring-1 hover:ring-accent-cyan/30 transition-all flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary text-2xl font-black">
              {initial}
            </div>
            {developer.status === "APPROVED" && (
              <div className="absolute -bottom-2 -right-2 bg-tertiary text-on-tertiary p-1 rounded-full border-2 border-surface-container-lowest">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {developer.aiRating !== null && (
            <div className="text-right">
              <div className="flex items-center justify-end text-secondary font-bold text-lg">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                </svg>
                {developer.aiRating.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold tracking-tight mb-1 text-on-surface group-hover:text-secondary transition-colors">
          {developer.displayName}
        </h3>
        {developer.bio && (
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed italic">
            &ldquo;{developer.bio}&rdquo;
          </p>
        )}

        {skillsToShow.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {skillsToShow.map((skill) => (
              <Badge key={skill.id}>
                {locale === "zh" ? skill.localeZh : skill.localeEn}
              </Badge>
            ))}
            {hasMore && (
              <Badge variant="outline">+{developer.skills.length - 5}</Badge>
            )}
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-outline-variant/5 flex items-center justify-between">
          {developer.hourlyRate !== null ? (
            <div>
              <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-0.5">
                {t("rateStartsAt")}
              </span>
              <span className="text-lg font-black text-on-surface">
                {formatCurrencyAmount(developer.hourlyRate, developer.currency)}
                <span className="text-xs font-normal text-on-surface-variant">{t("perHour")}</span>
              </span>
            </div>
          ) : (
            <span className="text-sm text-on-surface-variant">{t("rateNegotiable")}</span>
          )}
          <div className="flex gap-2">
            <span className="p-2 rounded-lg bg-surface-container-highest text-on-surface">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <span className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold tracking-widest uppercase">
              {t("viewProfile")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
