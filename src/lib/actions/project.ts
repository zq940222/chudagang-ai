"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProjectCategoryFilterValues, normalizeProjectCategory } from "@/lib/project-categories";
import { projectCreateSchema } from "@/lib/validators/project";
import type { ProjectCardData, ProjectSearchParams } from "@/types/project";

// ---------- helpers ----------

function toCardData(p: {
  id: string;
  title: string;
  description: string;
  budget: unknown;
  currency: string;
  category: string | null;
  status: string;
  skills: { skillTag: { id: string; name: string; localeZh: string; localeEn: string } }[];
  client: { name: string | null };
  _count: { applications: number };
  createdAt: Date;
}): ProjectCardData {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    budget: p.budget !== null && p.budget !== undefined ? Number(p.budget) : null,
    currency: p.currency,
    category: p.category,
    status: p.status,
    skills: p.skills.map((s) => ({
      id: s.skillTag.id,
      name: s.skillTag.name,
      localeZh: s.skillTag.localeZh,
      localeEn: s.skillTag.localeEn,
    })),
    clientName: p.client.name,
    applicationCount: p._count.applications,
    createdAt: p.createdAt.toISOString(),
  };
}

// ---------- createProject (from FormData) ----------

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    budget: formData.get("budget") || undefined,
    currency: formData.get("currency") || "CNY",
    category: formData.get("category") || undefined,
    skillTagIds: formData.getAll("skillTagIds"),
    visibility: formData.get("visibility") || "PUBLIC",
  };

  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
  }

  const { skillTagIds, ...data } = parsed.data;

  const project = await db.project.create({
    data: {
      ...data,
      clientId: session.user.id,
      status: "PUBLISHED",
      skills: {
        create: skillTagIds.map((skillTagId) => ({ skillTagId })),
      },
    },
    include: {
      skills: { include: { skillTag: true } },
      client: { select: { id: true, name: true, avatar: true } },
      _count: { select: { applications: true } },
    },
  });

  return { data: toCardData(project) };
}

// ---------- createProjectFromAI (structured data from AI tool) ----------

export async function createProjectFromAI(input: {
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  category?: string;
  skillTagIds: string[];
  conversationId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const project = await db.project.create({
    data: {
      title: input.title,
      description: input.description,
      budget: input.budget,
      currency: input.currency ?? "CNY",
      category: input.category,
      clientId: session.user.id,
      status: "DRAFT",
      skills: {
        create: input.skillTagIds.map((skillTagId) => ({ skillTagId })),
      },
    },
    include: {
      skills: { include: { skillTag: true } },
      client: { select: { id: true, name: true, avatar: true } },
      _count: { select: { applications: true } },
    },
  });

  // Link conversation to the newly created project if provided
  if (input.conversationId) {
    await db.conversation.update({
      where: { id: input.conversationId },
      data: { projectId: project.id },
    });
  }

  return { data: toCardData(project) };
}

// ---------- updateProjectStatus ----------

export async function updateProjectStatus(projectId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });

  if (!project) return { error: "Project not found" };
  if (project.clientId !== session.user.id) return { error: "Forbidden" };

  const updated = await db.project.update({
    where: { id: projectId },
    data: { status: status as "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED" | "CANCELLED" },
  });

  return { data: { id: updated.id, status: updated.status } };
}

// ---------- getMyProjects ----------

export async function getMyProjects() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const projects = await db.project.findMany({
    where: { clientId: session.user.id },
    include: {
      skills: { include: { skillTag: true } },
      client: { select: { id: true, name: true, avatar: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: projects.map(toCardData) };
}

// ---------- searchProjects ----------

export async function searchProjects(params: ProjectSearchParams): Promise<{
  data?: { projects: ProjectCardData[]; total: number };
  error?: string;
}> {
  const { query, skills, minBudget, maxBudget, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (minBudget !== undefined || maxBudget !== undefined) {
    where.budget = {};
    if (minBudget !== undefined) (where.budget as Record<string, number>).gte = minBudget;
    if (maxBudget !== undefined) (where.budget as Record<string, number>).lte = maxBudget;
  }

  if (params.category) {
    const normalized = normalizeProjectCategory(params.category);
    const values = getProjectCategoryFilterValues(normalized);
    where.category = { in: values };
  }

  if (skills && skills.length > 0) {
    where.skills = { some: { skillTag: { name: { in: skills } } } };
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        skills: { include: { skillTag: true } },
        client: { select: { id: true, name: true, avatar: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  return { data: { projects: projects.map(toCardData), total } };
}
