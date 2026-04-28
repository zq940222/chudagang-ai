"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function switchRole(newRole: UserRole) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (newRole !== "CLIENT" && newRole !== "DEVELOPER") {
    return { error: "Invalid role" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user) return { error: "User not found" };

  const updateData: { activeRole: UserRole; roles?: UserRole[] } = {
    activeRole: newRole,
  };

  // If the role isn't yet enabled for this user, add it
  if (!user.roles.includes(newRole)) {
    updateData.roles = [...user.roles, newRole];
  }

  await db.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return { success: true, activeRole: newRole };
}
