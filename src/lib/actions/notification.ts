"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getMyNotifications(opts?: { unreadOnly?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const where: Record<string, unknown> = { userId: session.user.id };
  if (opts?.unreadOnly) where.read = false;

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return { data: 0 };

  const count = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return { data: count };
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  return { data: { success: true } };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return { data: { success: true } };
}
