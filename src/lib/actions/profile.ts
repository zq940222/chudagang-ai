"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileCreateSchema, profileUpdateSchema } from "@/lib/validators/profile";
import { revalidatePath } from "next/cache";
import { reviewDeveloperProfile } from "@/lib/services/developer-review";

export async function createProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const raw = {
    displayName: formData.get("displayName"),
    title: formData.get("title"),
    bio: formData.get("bio"),
    githubUrl: formData.get("githubUrl"),
    portfolioUrl: formData.get("portfolioUrl"),
    hourlyRate: formData.get("hourlyRate"),
    currency: formData.get("currency"),
    skillTagIds: formData.getAll("skillTagIds"),
  };

  const parsed = profileCreateSchema.parse(raw);
  const { skillTagIds, ...profileData } = parsed;

  const profile = await db.developerProfile.create({
    data: {
      ...profileData,
      hourlyRate: profileData.hourlyRate ?? null,
      userId: session.user.id,
      status: "PENDING_REVIEW",
      skills: {
        create: skillTagIds.map((id) => ({ skillTagId: id })),
      },
    },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { role: "DEVELOPER" },
  });

  // Trigger AI review in background (don't block the response)
  reviewDeveloperProfile(profile.id).catch(console.error);

  revalidatePath("/dashboard/developer/profile");
  return { success: true, profileId: profile.id };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  const raw = {
    displayName: formData.get("displayName") || undefined,
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    githubUrl: formData.get("githubUrl") || undefined,
    portfolioUrl: formData.get("portfolioUrl") || undefined,
    hourlyRate: formData.get("hourlyRate") || undefined,
    currency: formData.get("currency") || undefined,
    skillTagIds: formData.getAll("skillTagIds"),
  };

  const parsed = profileUpdateSchema.parse(raw);
  const { skillTagIds, ...profileData } = parsed;

  await db.$transaction(async (tx) => {
    await tx.developerProfile.update({
      where: { id: profile.id },
      data: { ...profileData, hourlyRate: profileData.hourlyRate ?? undefined },
    });

    if (skillTagIds && skillTagIds.length > 0) {
      await tx.developerSkill.deleteMany({ where: { profileId: profile.id } });
      await tx.developerSkill.createMany({
        data: skillTagIds.map((id) => ({ profileId: profile.id, skillTagId: id })),
      });
    }
  });

  revalidatePath("/dashboard/developer/profile");
  return { success: true };
}

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.developerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      skills: { include: { skillTag: true } },
      availabilities: { where: { date: { gte: new Date() } }, orderBy: { date: "asc" } },
    },
  });
}

export async function getSkillTags() {
  return db.skillTag.findMany({ orderBy: { category: "asc" } });
}
