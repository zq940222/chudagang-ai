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
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <Badge variant="accent">{t("badge")}</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-on-surface sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
          {t("pageDesc")}
        </p>
      </div>
      <DeveloperApplyTabs skillTags={skillTags} profile={serializableProfile} />
    </div>
  );
}
