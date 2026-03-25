"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { availabilityBatchSchema } from "@/lib/validators/profile";
import { revalidatePath } from "next/cache";

export async function setAvailability(formData: {
  slots: { date: string; startTime: string; endTime: string; status?: string; note?: string }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  const parsed = availabilityBatchSchema.parse(formData);

  await db.$transaction(async (tx) => {
    const dates = [...new Set(parsed.slots.map((s) => s.date))];
    for (const date of dates) {
      await tx.availability.deleteMany({
        where: { profileId: profile.id, date: new Date(date) },
      });
    }

    await tx.availability.createMany({
      data: parsed.slots.map((slot) => ({
        profileId: profile.id,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: (slot.status as "AVAILABLE" | "BUSY" | "TENTATIVE" | "BLOCKED") ?? "AVAILABLE",
        note: slot.note,
      })),
    });
  });

  revalidatePath("/dashboard/developer/calendar");
  return { success: true };
}

export async function getMyAvailability(month: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return [];

  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  return db.availability.findMany({
    where: {
      profileId: profile.id,
      date: { gte: startDate, lt: endDate },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function deleteAvailabilitySlot(slotId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  await db.availability.deleteMany({
    where: { id: slotId, profileId: profile.id },
  });

  revalidatePath("/dashboard/developer/calendar");
  return { success: true };
}
