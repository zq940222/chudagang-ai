import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProfile, getSkillTags } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/developer/profile-form";

export default async function DeveloperProfilePage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const [profile, skillTags] = await Promise.all([
    getMyProfile(),
    getSkillTags(),
  ]);

  const mode = profile ? "edit" : "create";
  const initialData = profile
    ? {
        displayName: profile.displayName,
        title: profile.title,
        bio: profile.bio,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
        currency: profile.currency,
        skills: profile.skills.map((s) => ({ skillTagId: s.skillTag.id })),
      }
    : undefined;

  return (
    <div className="max-w-2xl">
      <ProfileForm
        skillTags={skillTags}
        initialData={initialData}
        mode={mode}
      />
    </div>
  );
}
