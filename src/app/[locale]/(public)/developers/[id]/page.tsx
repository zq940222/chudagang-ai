import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

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

  const initial = profile.displayName.charAt(0).toUpperCase();
  const currencySymbol =
    profile.currency === "CNY" ? "\u00A5" : profile.currency === "EUR" ? "\u20AC" : "$";

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-on-surface">
            {profile.displayName}
          </h1>
          {profile.title && (
            <p className="text-lg text-on-surface-variant">{profile.title}</p>
          )}
          <div className="mt-2 flex items-center gap-4">
            {profile.aiRating && (
              <span className="rounded-md bg-accent-cyan/10 px-2.5 py-0.5 text-sm font-semibold text-accent-cyan">
                {Number(profile.aiRating).toFixed(1)} rating
              </span>
            )}
            {profile.hourlyRate && (
              <span className="text-sm font-medium text-on-surface">
                {currencySymbol}
                {Number(profile.hourlyRate)}/hr
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-on-surface">About</h2>
          <p className="mt-2 whitespace-pre-line text-on-surface-variant">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-on-surface">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
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

      {/* Links */}
      {(profile.githubUrl || profile.portfolioUrl) && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-on-surface">Links</h2>
          <div className="mt-2 flex flex-col gap-2">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-cyan hover:underline"
              >
                GitHub
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-cyan hover:underline"
              >
                Portfolio
              </a>
            )}
          </div>
        </div>
      )}

      {/* Upcoming availability */}
      {profile.availabilities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-on-surface">
            Upcoming Availability
          </h2>
          <div className="mt-2 space-y-2">
            {profile.availabilities.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-3 ghost-border"
              >
                <span className="text-sm font-medium text-on-surface">
                  {new Date(slot.date).toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {slot.startTime} - {slot.endTime}
                </span>
                {slot.note && (
                  <span className="text-xs text-on-surface-variant/70">
                    {slot.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
