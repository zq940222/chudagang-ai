"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  return { success: true };
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.hashedPassword) return { error: "No password set" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) return { error: "Wrong password" };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword: hashed },
  });

  return { success: true };
}
