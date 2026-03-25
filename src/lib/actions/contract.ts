"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateContractTerms } from "@/lib/services/contract-generator";
import {
  createContractSchema,
  signContractSchema,
} from "@/lib/validators/contract";
import type { ContractCardData, ContractWithDetails } from "@/types/contract";
import { capturePayment, transferToDeveloper } from "@/lib/services/stripe";

export async function createContractFromApplication(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          clientId: true,
          budget: true,
          currency: true,
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) return { error: "Application not found" };
  if (application.project.clientId !== session.user.id) {
    return { error: "Only the project owner can create contracts" };
  }
  if (application.status !== "ACCEPTED") {
    return { error: "Can only create contract from accepted application" };
  }

  // Check if contract already exists
  const existingContract = await db.contract.findFirst({
    where: {
      projectId: application.projectId,
      developerId: application.developerId,
    },
  });

  if (existingContract) {
    return { error: "Contract already exists for this application" };
  }

  // Determine total amount from proposed rate or project budget
  const totalAmount = application.proposedRate
    ? Number(application.proposedRate)
    : application.project.budget
      ? Number(application.project.budget)
      : 0;

  if (totalAmount <= 0) return { error: "Contract amount must be positive" };

  // Generate AI contract terms
  const terms = await generateContractTerms({
    projectTitle: application.project.title,
    projectDescription: application.project.description,
    developerName: application.developer.name ?? "Developer",
    clientName: session.user.name ?? "Client",
    totalAmount,
    currency: application.project.currency,
  });

  const contract = await db.contract.create({
    data: {
      projectId: application.projectId,
      clientId: application.project.clientId,
      developerId: application.developerId,
      title: `Contract for ${application.project.title}`,
      terms: terms as any,
      totalAmount,
      currency: application.project.currency,
      status: "PENDING_SIGN",
    },
  });

  // Update project status
  await db.project.update({
    where: { id: application.projectId },
    data: { status: "IN_PROGRESS" },
  });

  // Notify developer
  await db.notification.create({
    data: {
      userId: application.developerId,
      type: "CONTRACT_READY",
      title: "New Contract",
      body: `A contract has been created for "${application.project.title}". Please review and sign.`,
      link: `/dashboard/developer/contracts/${contract.id}`,
    },
  });

  return { data: { id: contract.id } };
}

export async function signContract(contractId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = signContractSchema.safeParse({ contractId });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      clientId: true,
      developerId: true,
      status: true,
      signedByClient: true,
      signedByDeveloper: true,
      project: { select: { title: true } },
    },
  });

  if (!contract) return { error: "Contract not found" };
  if (contract.status !== "PENDING_SIGN") {
    return { error: "Contract is not pending signature" };
  }

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;

  if (!isClient && !isDeveloper) {
    return { error: "You are not a party to this contract" };
  }

  // Update signature
  const updateData: any = {};
  if (isClient) {
    if (contract.signedByClient) {
      return { error: "You have already signed this contract" };
    }
    updateData.signedByClient = new Date();
  } else if (isDeveloper) {
    if (contract.signedByDeveloper) {
      return { error: "You have already signed this contract" };
    }
    updateData.signedByDeveloper = new Date();
  }

  // Check if both parties will have signed after this update
  const bothSigned =
    (contract.signedByClient || isClient) &&
    (contract.signedByDeveloper || isDeveloper);

  if (bothSigned) {
    updateData.status = "ACTIVE";
    updateData.signedAt = new Date();
  }

  const updatedContract = await db.contract.update({
    where: { id: contractId },
    data: updateData,
  });

  // Notify counterparty
  const counterpartyId = isClient ? contract.developerId : contract.clientId;
  const notificationBody = bothSigned
    ? `Contract for "${contract.project.title}" is now active.`
    : `${isClient ? "Client" : "Developer"} has signed the contract for "${contract.project.title}".`;

  await db.notification.create({
    data: {
      userId: counterpartyId,
      type: bothSigned ? "CONTRACT_READY" : "CONTRACT_READY",
      title: bothSigned ? "Contract Active" : "Contract Signed",
      body: notificationBody,
      link: isClient
        ? `/dashboard/developer/contracts/${contract.id}`
        : `/dashboard/client/contracts/${contract.id}`,
    },
  });

  return { data: { status: updatedContract.status } };
}

export async function transitionContract(
  contractId: string,
  newStatus: string,
  reviewComment?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      clientId: true,
      developerId: true,
      status: true,
      projectId: true,
      project: { select: { title: true } },
    },
  });

  if (!contract) return { error: "Contract not found" };

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;

  if (!isClient && !isDeveloper) {
    return { error: "You are not a party to this contract" };
  }

  // Validate state machine transitions
  const validTransitions: Record<string, string[]> = {
    DRAFT: ["PENDING_SIGN", "CANCELLED"],
    PENDING_SIGN: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["DELIVERED", "DISPUTED", "CANCELLED"],
    DELIVERED: ["COMPLETED", "ACTIVE", "DISPUTED"],
    DISPUTED: ["ACTIVE", "CANCELLED"],
  };

  const allowedTransitions = validTransitions[contract.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      error: `Invalid transition from ${contract.status} to ${newStatus}`,
    };
  }

  // Role-specific rules
  if (newStatus === "DELIVERED" && !isDeveloper) {
    return { error: "Only developer can mark contract as delivered" };
  }

  if (newStatus === "COMPLETED" && !isClient) {
    return { error: "Only client can mark contract as completed" };
  }

  // Revision request (DELIVERED → ACTIVE)
  if (
    contract.status === "DELIVERED" &&
    newStatus === "ACTIVE" &&
    !isClient
  ) {
    return { error: "Only client can request revisions" };
  }

  const updatedContract = await db.contract.update({
    where: { id: contractId },
    data: { status: newStatus as any },
  });

  // Release escrow payment and complete project if contract is completed
  if (newStatus === "COMPLETED") {
    // Release escrow payment
    const heldPayment = await db.payment.findFirst({
      where: { contractId, status: "HELD" },
    });

    if (heldPayment?.providerPaymentId) {
      try {
        await capturePayment(heldPayment.providerPaymentId);
        await db.payment.update({
          where: { id: heldPayment.id },
          data: { status: "RELEASED" },
        });

        // Transfer to developer if they have Stripe Connect
        const devProfile = await db.developerProfile.findUnique({
          where: { userId: contract.developerId },
          select: { stripeConnectAccountId: true },
        });

        if (devProfile?.stripeConnectAccountId) {
          await transferToDeveloper({
            amount: Number(heldPayment.amount),
            currency: heldPayment.currency,
            connectedAccountId: devProfile.stripeConnectAccountId,
            contractId,
          });
        }
      } catch (err) {
        console.error("Payment release error:", err);
        // Don't fail the transition — payment can be manually resolved
      }
    }

    // Also complete the project
    await db.project.update({
      where: { id: contract.projectId },
      data: { status: "COMPLETED" },
    });
  }

  // Notify counterparty
  const counterpartyId = isClient ? contract.developerId : contract.clientId;
  const notificationTitles: Record<string, string> = {
    DELIVERED: "Delivery Submitted",
    COMPLETED: "Contract Completed",
    DISPUTED: "Contract Disputed",
    CANCELLED: "Contract Cancelled",
    ACTIVE: "Revision Requested",
  };

  const notificationBodies: Record<string, string> = {
    DELIVERED: `Developer has submitted delivery for "${contract.project.title}".`,
    COMPLETED: `Contract for "${contract.project.title}" has been marked as completed.`,
    DISPUTED: `Contract for "${contract.project.title}" is now disputed.`,
    CANCELLED: `Contract for "${contract.project.title}" has been cancelled.`,
    ACTIVE: `Client has requested revisions for "${contract.project.title}". ${reviewComment ? `Comment: ${reviewComment}` : ""}`,
  };

  if (notificationTitles[newStatus]) {
    await db.notification.create({
      data: {
        userId: counterpartyId,
        type: "GENERAL",
        title: notificationTitles[newStatus],
        body: notificationBodies[newStatus],
        link: isClient
          ? `/dashboard/developer/contracts/${contract.id}`
          : `/dashboard/client/contracts/${contract.id}`,
      },
    });
  }

  return { data: { status: updatedContract.status } };
}

export async function getContract(
  contractId: string
): Promise<{ data?: ContractWithDetails; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      deliverables: {
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contract) return { error: "Contract not found" };

  if (
    contract.clientId !== session.user.id &&
    contract.developerId !== session.user.id
  ) {
    return { error: "Forbidden" };
  }

  return { data: contract as ContractWithDetails };
}

export async function getMyContracts(
  role: "client" | "developer"
): Promise<{ data?: ContractCardData[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const whereClause =
    role === "client"
      ? { clientId: session.user.id }
      : { developerId: session.user.id };

  const contracts = await db.contract.findMany({
    where: whereClause,
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          deliverables: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: contracts.map((c) => ({
      id: c.id,
      title: c.title,
      projectTitle: c.project.title,
      projectId: c.projectId,
      counterpartyName:
        role === "client" ? c.developer.name : c.client.name,
      totalAmount: Number(c.totalAmount),
      currency: c.currency,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
