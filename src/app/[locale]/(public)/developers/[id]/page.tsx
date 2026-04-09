import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatCurrencyAmount } from "@/lib/currency";
import { getDeveloperReviews } from "@/lib/actions/review";
import { ReviewSummary } from "@/components/review/review-summary";

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("developers");

  const profile = await db.developerProfile.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      user: { select: { name: true, avatar: true } },
      skills: { include: { skillTag: true } },
      availabilities: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 10,
      },
    },
  });

  if (!profile) notFound();

  const reviewsResult = await getDeveloperReviews(profile.userId);
  const reviewData = reviewsResult.data;

  const initial = profile.displayName.charAt(0).toUpperCase();
  const displayRate = profile.hourlyRate
    ? formatCurrencyAmount(Number(profile.hourlyRate), profile.currency)
    : null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-container text-4xl font-black text-on-primary shadow-2xl">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">
                {profile.displayName}
              </h1>
              {profile.title && (
                <p className="mt-2 text-xl font-medium text-accent-cyan">{profile.title}</p>
              )}
              <div className="mt-4 flex items-center gap-3">
                {profile.aiRating && (
                  <div className="flex items-center gap-1 rounded-full bg-accent-cyan/10 px-3 py-1 text-xs font-bold text-accent-cyan uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {Number(profile.aiRating).toFixed(1)} {t("aiScore")}
                  </div>
                )}
                <span className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  {t("verifiedExpert")}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="rounded-3xl bg-surface-container-lowest p-8 ghost-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 blur-3xl -z-10" />
              <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em] mb-4">{t("about")}</h2>
              <p className="text-lg leading-relaxed text-on-surface-variant/90 font-medium">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">{t("expertise")}</h2>
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((s) => (
                  <span
                    key={s.skillTag.id}
                    className="rounded-xl bg-surface-container px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container-high transition-colors cursor-default"
                  >
                    {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviewData && (
            <div className="space-y-6">
              <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">
                {t("reviews")}
              </h2>
              <ReviewSummary
                averageRating={reviewData.averageRating}
                totalReviews={reviewData.totalReviews}
                topTags={reviewData.topTags}
                reviews={reviewData.reviews}
              />
            </div>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-8">
          {/* Rate & Availability Card */}
          <div className="sticky top-24 rounded-3xl bg-primary p-8 text-on-primary shadow-2xl shadow-primary/20 space-y-8">
            {displayRate && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{t("rateLabel")}</p>
                <p className="text-4xl font-black tracking-tight">
                  {displayRate}
                  <span className="text-xl font-medium opacity-60 ml-1">{t("perHour")}</span>
                </p>
              </div>
            )}

            {/* Availability */}
            {profile.availabilities.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{t("nextAvailable")}</p>
                <div className="space-y-2">
                  {profile.availabilities.slice(0, 3).map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-sm font-bold backdrop-blur-sm"
                    >
                      <span>
                        {new Date(slot.date).toLocaleDateString(locale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-accent-cyan">{slot.startTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.githubUrl || profile.portfolioUrl) && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{t("externalProof")}</p>
                <div className="flex flex-col gap-3">
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-accent-cyan hover:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 4.287 9.607 9.607 10.607.6.11.82-.258.82-.577 0-.285-.02-1.04-.032-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      {t("githubProfile")}
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-accent-cyan hover:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      {t("portfolio")}
                    </a>
                  )}
                </div>
              </div>
            )}

            <Button className="w-full bg-accent-cyan text-primary hover:bg-white transition-colors h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
              {t("directMessage")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
