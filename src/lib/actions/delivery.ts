"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const submitDeliverableSchema = z.object({
  contractId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
});

const reviewDeliverableSchema = z.object({
  deliverableId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reviewComment: z.string().max(2000).optional(),
});

export async function submitDeliverable(data: {
  contractId: string;
  title: string;
  description?: string;
  fileUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = submitDeliverableSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const contract = await db.contract.findUnique({
    where: { id: parsed.data.contractId },
    include: { project: { select: { title: true } } },
  });

  if (!contract) return { error: "Contract not found" };
  if (contract.developerId !== session.user.id) {
    return { error: "Only the contract developer can submit deliverables" };
  }
  if (contract.status !== "ACTIVE") {
    return { error: "Contract must be active to submit deliverables" };
  }

  const deliverable = await db.deliverable.create({
    data: {
      contractId: parsed.data.contractId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      fileUrl: parsed.data.fileUrl ?? null,
      uploadedBy: session.user.id,
    },
  });

  await db.contract.update({
    where: { id: parsed.data.contractId },
    data: { status: "DELIVERED" },
  });

  await db.notification.create({
    data: {
      userId: contract.clientId,
      type: "DELIVERY_SUBMITTED",
      title: "Delivery Submitted",
      body: `Developer has submitted a deliverable for "${contract.project.title}".`,
      link: `/dashboard/client/projects/${contract.projectId}`,
    },
  });

  return { data: { id: deliverable.id } };
}

export async function reviewDeliverable(data: {
  deliverableId: string;
  status: "ACCEPTED" | "REJECTED";
  reviewComment?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = reviewDeliverableSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const deliverable = await db.deliverable.findUnique({
    where: { id: parsed.data.deliverableId },
    include: {
      contract: {
        select: {
          id: true,
          clientId: true,
          developerId: true,
          projectId: true,
          status: true,
        },
      },
    },
  });

  if (!deliverable) return { error: "Deliverable not found" };
  if (deliverable.contract.clientId !== session.user.id) {
    return { error: "Only the client can review deliverables" };
  }

  await db.deliverable.update({
    where: { id: parsed.data.deliverableId },
    data: {
      status: parsed.data.status,
      reviewComment: parsed.data.reviewComment ?? null,
    },
  });

  if (parsed.data.status === "REJECTED") {
    await db.contract.update({
      where: { id: deliverable.contractId },
      data: { status: "ACTIVE" },
    });
  }

  return { data: { success: true } };
}

export async function getContractDeliverables(contractId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { clientId: true, developerId: true },
  });

  if (!contract) return { error: "Contract not found" };
  if (
    contract.clientId !== session.user.id &&
    contract.developerId !== session.user.id
  ) {
    return { error: "Forbidden" };
  }

  const deliverables = await db.deliverable.findMany({
    where: { contractId },
    include: {
      uploader: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: deliverables };
}
