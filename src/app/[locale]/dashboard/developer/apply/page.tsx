import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getMyProfile, getSkillTags } from "@/lib/actions/profile";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { DeveloperApplyTabs } from "@/components/developer/developer-apply-tabs";

export default async function DeveloperApplyPage() {
  const [session, locale, profile] = await Promise.all([auth(), getLocale(), getMyProfile()]);
  if (!session?.user?.id) redirect(`/${locale}/login`);


  const t = await getTranslations("developerApply");
  const skillTags = await getSkillTags();

  // Convert profile to a serializable object for the client component
  const serializableProfile = profile ? {
    displayName: profile.displayName,
    title: profile.title,
    bio: profile.bio,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
    currency: profile.currency,
    skills: profile.skills.map(s => ({ skillTagId: s.skillTagId }))
  } : null;

  return (
    <div className="fixed inset-0 top-16 z-10 flex flex-col overflow-y-auto bg-surface">
      <section className="flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))]">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-16 lg:py-16">
          <div className="mb-10 text-center">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="accent">{t("badge")}</Badge>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
              {t("pageDesc")}
            </p>
          </div>
          <DeveloperApplyTabs skillTags={skillTags} profile={serializableProfile} />
        </div>
      </section>
    </div>
  );
}
