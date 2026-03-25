"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  applyToProjectSchema,
  updateApplicationStatusSchema,
} from "@/lib/validators/application";
import type { ApplicationCardData } from "@/types/contract";

// ---------- applyToProject ----------

export async function applyToProject(data: {
  projectId: string;
  coverLetter?: string;
  proposedRate?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = applyToProjectSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Developer profile required" };

  const project = await db.project.findUnique({
    where: { id: parsed.data.projectId, status: "PUBLISHED" },
  });
  if (!project) return { error: "Project not found or not accepting applications" };

  if (project.clientId === session.user.id) {
    return { error: "Cannot apply to your own project" };
  }

  const existing = await db.application.findUnique({
    where: {
      projectId_developerId: {
        projectId: parsed.data.projectId,
        developerId: session.user.id,
      },
    },
  });
  if (existing) return { error: "Already applied to this project" };

  const application = await db.application.create({
    data: {
      projectId: parsed.data.projectId,
      developerId: session.user.id,
      coverLetter: parsed.data.coverLetter ?? null,
      proposedRate: parsed.data.proposedRate ?? null,
    },
  });

  await db.notification.create({
    data: {
      userId: project.clientId,
      type: "APPLICATION_RECEIVED",
      title: "New Application",
      body: `A developer has applied to "${project.title}"`,
      link: `/dashboard/client/projects/${project.id}`,
    },
  });

  return { data: { id: application.id } };
}

// ---------- updateApplicationStatus ----------

export async function updateApplicationStatus(data: {
  applicationId: string;
  status: "SHORTLISTED" | "ACCEPTED" | "REJECTED";
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = updateApplicationStatusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const application = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { project: { select: { clientId: true, title: true } } },
  });

  if (!application) return { error: "Application not found" };
  if (application.project.clientId !== session.user.id) {
    return { error: "Forbidden" };
  }

  const updated = await db.application.update({
    where: { id: parsed.data.applicationId },
    data: { status: parsed.data.status },
  });

  await db.notification.create({
    data: {
      userId: application.developerId,
      type:
        parsed.data.status === "ACCEPTED"
          ? "APPLICATION_ACCEPTED"
          : "GENERAL",
      title: `Application ${parsed.data.status.toLowerCase()}`,
      body: `Your application for "${application.project.title}" has been ${parsed.data.status.toLowerCase()}.`,
      link:
        parsed.data.status === "ACCEPTED"
          ? `/dashboard/developer/projects`
          : undefined,
    },
  });

  return { data: { id: updated.id, status: updated.status } };
}

// ---------- getProjectApplications ----------

export async function getProjectApplications(
  projectId: string
): Promise<{ data?: ApplicationCardData[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });
  if (!project || project.clientId !== session.user.id) {
    return { error: "Forbidden" };
  }

  const applications = await db.application.findMany({
    where: { projectId },
    include: {
      developer: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: applications.map((a) => ({
      id: a.id,
      developerId: a.developerId,
      developerName: a.developer.name,
      developerAvatar: a.developer.avatar,
      coverLetter: a.coverLetter,
      proposedRate: a.proposedRate ? Number(a.proposedRate) : null,
      status: a.status,
      aiScore: a.aiScore ? Number(a.aiScore) : null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

// ---------- getMyApplications ----------

export async function getMyApplications(): Promise<{
  data?: ApplicationCardData[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const applications = await db.application.findMany({
    where: { developerId: session.user.id },
    include: {
      developer: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: applications.map((a) => ({
      id: a.id,
      developerId: a.developerId,
      developerName: a.developer.name,
      developerAvatar: a.developer.avatar,
      coverLetter: a.coverLetter,
      proposedRate: a.proposedRate ? Number(a.proposedRate) : null,
      status: a.status,
      aiScore: a.aiScore ? Number(a.aiScore) : null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

// ---------- withdrawApplication ----------

export async function withdrawApplication(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const application = await db.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) return { error: "Application not found" };
  if (application.developerId !== session.user.id) {
    return { error: "Forbidden" };
  }
  if (application.status !== "PENDING" && application.status !== "SHORTLISTED") {
    return { error: "Cannot withdraw at this stage" };
  }

  await db.application.update({
    where: { id: applicationId },
    data: { status: "WITHDRAWN" },
  });

  return { data: { success: true } };
}
