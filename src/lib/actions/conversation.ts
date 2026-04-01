"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ConversationStatus } from "@prisma/client";

// ---------- createConversation ----------

export async function createConversation(opts?: {
  projectId?: string;
  modelProvider?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const conversation = await db.conversation.create({
    data: {
      userId: session.user.id,
      projectId: opts?.projectId,
      modelProvider: opts?.modelProvider ?? process.env.AI_DEFAULT_PROVIDER ?? "openai",
      status: "DISCOVERY",
    },
  });

  return { data: { id: conversation.id, status: conversation.status } };
}

// ---------- getConversation ----------

export async function getConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      project: {
        include: {
          skills: { include: { skillTag: true } },
          client: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  if (!conversation) return { error: "Conversation not found" };
  if (conversation.userId !== session.user.id) return { error: "Forbidden" };

  return {
    data: {
      id: conversation.id,
      status: conversation.status,
      modelProvider: conversation.modelProvider,
      createdAt: conversation.createdAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
      project: conversation.project
        ? {
            id: conversation.project.id,
            title: conversation.project.title,
            status: conversation.project.status,
            skills: conversation.project.skills.map((s) => ({
              id: s.skillTag.id,
              name: s.skillTag.name,
              localeZh: s.skillTag.localeZh,
              localeEn: s.skillTag.localeEn,
            })),
          }
        : null,
    },
  };
}

// ---------- getMyConversations ----------

export async function getMyConversations() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const conversations = await db.conversation.findMany({
    where: { userId: session.user.id },
    include: {
      project: { select: { id: true, title: true, status: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    data: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      modelProvider: c.modelProvider,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c._count.messages,
      project: c.project
        ? { id: c.project.id, title: c.project.title, status: c.project.status }
        : null,
    })),
  };
}

// ---------- updateConversationStatus ----------

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });

  if (!conversation) return { error: "Conversation not found" };
  if (conversation.userId !== session.user.id) return { error: "Forbidden" };

  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: { status },
  });

  return { data: { id: updated.id, status: updated.status } };
}
