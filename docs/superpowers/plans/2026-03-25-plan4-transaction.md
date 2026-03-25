# Plan 4: Transaction System — Applications, Contracts, Payments & Delivery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete transaction pipeline: developer applies to project → client accepts → contract auto-generated → both sign → Stripe escrow payment → developer delivers → client accepts → payment released.

**Architecture:** Server Actions for application/contract/delivery CRUD. Stripe Checkout for payment collection (escrow via manual capture). Stripe Connect Express for developer payouts. Webhook handler for payment event processing with idempotency. Contract state machine enforced in server actions.

**Tech Stack:** Prisma 7, Server Actions, Stripe (Checkout + Connect + Webhooks), Zod validators, next-intl

**Spec reference:** `docs/superpowers/specs/2026-03-24-project-hall-ai-marketplace-design.md` — Sections 3, 5, 6

**Depends on:** Plan 1 (Foundation) + Plan 2 (Developer System) + Plan 3 (Project & AI) — completed

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   └── dashboard/
│   │       ├── client/
│   │       │   └── projects/
│   │       │       └── [id]/
│   │       │           └── page.tsx              # Project management (applications, contract)
│   │       └── developer/
│   │           ├── projects/
│   │           │   ├── page.tsx                  # My contracts list
│   │           │   └── [id]/
│   │           │       └── page.tsx              # Contract detail + delivery
│   │           └── earnings/
│   │               └── page.tsx                  # Earnings overview
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts                      # Stripe webhook handler
│   │   └── stripe/
│   │       ├── checkout/route.ts                 # Create Stripe Checkout session
│   │       └── connect/route.ts                  # Stripe Connect onboarding
├── lib/
│   ├── actions/
│   │   ├── application.ts                        # Application CRUD
│   │   ├── contract.ts                           # Contract state machine + CRUD
│   │   └── delivery.ts                           # Deliverable submission + review
│   ├── services/
│   │   ├── stripe.ts                             # Stripe service (checkout, connect, transfer)
│   │   └── contract-generator.ts                 # AI contract draft generation
│   └── validators/
│       ├── application.ts                        # Application Zod schemas
│       └── contract.ts                           # Contract Zod schemas
├── components/
│   ├── application/
│   │   ├── application-form.tsx                  # Developer applies to project
│   │   └── application-list.tsx                  # Client views applications
│   ├── contract/
│   │   ├── contract-view.tsx                     # Contract detail display
│   │   └── contract-actions.tsx                  # Sign, pay, deliver, accept buttons
│   └── delivery/
│       └── delivery-form.tsx                     # Developer submits deliverable
└── types/
    └── contract.ts                               # Contract & application types
```

---

## Task 1: Application Types, Validators & Server Actions

**Files:**
- Create: `src/types/contract.ts`
- Create: `src/lib/validators/application.ts`
- Create: `src/lib/validators/contract.ts`
- Create: `src/lib/actions/application.ts`

- [ ] **Step 1: Create contract & application types**

Create `src/types/contract.ts`:

```typescript
import type {
  Application,
  Contract,
  Deliverable,
  Payment,
  User,
  Project,
} from "@prisma/client";

export type ApplicationWithDetails = Application & {
  developer: Pick<User, "id" | "name" | "avatar">;
  project: Pick<Project, "id" | "title" | "status">;
};

export type ContractWithDetails = Contract & {
  project: Pick<Project, "id" | "title" | "description" | "category">;
  client: Pick<User, "id" | "name" | "avatar">;
  developer: Pick<User, "id" | "name" | "avatar">;
  payments: Payment[];
  deliverables: Deliverable[];
};

export type ApplicationCardData = {
  id: string;
  developerName: string | null;
  developerAvatar: string | null;
  developerId: string;
  coverLetter: string | null;
  proposedRate: number | null;
  status: string;
  aiScore: number | null;
  createdAt: string;
};

export type ContractCardData = {
  id: string;
  title: string;
  projectTitle: string;
  projectId: string;
  counterpartyName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};
```

- [ ] **Step 2: Create application validators**

Create `src/lib/validators/application.ts`:

```typescript
import { z } from "zod";

export const applyToProjectSchema = z.object({
  projectId: z.string().min(1),
  coverLetter: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => v?.trim() || null),
  proposedRate: z
    .number()
    .min(0)
    .max(10000)
    .optional()
    .transform((v) => v ?? null),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED"]),
});
```

- [ ] **Step 3: Create contract validators**

Create `src/lib/validators/contract.ts`:

```typescript
import { z } from "zod";

export const createContractSchema = z.object({
  projectId: z.string().min(1),
  developerId: z.string().min(1),
  title: z.string().min(3).max(200),
  terms: z.record(z.unknown()),
  totalAmount: z.number().min(1),
  currency: z.enum(["USD", "CNY", "EUR"]).default("USD"),
});

export const signContractSchema = z.object({
  contractId: z.string().min(1),
});
```

- [ ] **Step 4: Create application server actions**

Create `src/lib/actions/application.ts`:

```typescript
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

  // Verify developer has a profile
  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Developer profile required" };

  // Verify project exists and is published
  const project = await db.project.findUnique({
    where: { id: parsed.data.projectId, status: "PUBLISHED" },
  });
  if (!project) return { error: "Project not found or not accepting applications" };

  // Cannot apply to own project
  if (project.clientId === session.user.id) {
    return { error: "Cannot apply to your own project" };
  }

  // Check for existing application
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

  // Create notification for project owner
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

  // Notify developer
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
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add application types, validators, and server actions"
```

---

## Task 2: Contract Server Actions & AI Contract Generator

**Files:**
- Create: `src/lib/services/contract-generator.ts`
- Create: `src/lib/actions/contract.ts`
- Create: `src/lib/actions/delivery.ts`

- [ ] **Step 1: Create AI contract generator**

Create `src/lib/services/contract-generator.ts`:

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const contractTermsSchema = z.object({
  scope: z.string().describe("Detailed scope of work"),
  deliverables: z.array(z.string()).describe("List of expected deliverables"),
  timeline: z.string().describe("Estimated timeline for completion"),
  revisionPolicy: z.string().describe("Policy on revision requests"),
  cancellationPolicy: z.string().describe("Cancellation and refund terms"),
  intellectualProperty: z.string().describe("IP ownership terms"),
  confidentiality: z.string().describe("Confidentiality obligations"),
});

export async function generateContractTerms(input: {
  projectTitle: string;
  projectDescription: string;
  developerName: string;
  clientName: string;
  totalAmount: number;
  currency: string;
}) {
  const { object: terms } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: contractTermsSchema,
    prompt: `Generate professional contract terms for a freelance AI development project.

Project: ${input.projectTitle}
Description: ${input.projectDescription}
Developer: ${input.developerName}
Client: ${input.clientName}
Amount: ${input.currency} ${input.totalAmount}

Generate clear, fair terms covering scope, deliverables, timeline, revision policy, cancellation, IP, and confidentiality.
Keep each section to 2-3 sentences. Be specific but concise.`,
  });

  return terms;
}
```

- [ ] **Step 2: Create contract server actions**

Create `src/lib/actions/contract.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createContractSchema, signContractSchema } from "@/lib/validators/contract";
import { generateContractTerms } from "@/lib/services/contract-generator";
import type { ContractCardData, ContractWithDetails } from "@/types/contract";

// ---------- Valid state transitions ----------

const validTransitions: Record<string, string[]> = {
  DRAFT: ["PENDING_SIGN", "CANCELLED"],
  PENDING_SIGN: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["DELIVERED", "DISPUTED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "ACTIVE", "DISPUTED"],
  DISPUTED: ["ACTIVE", "CANCELLED"],
};

// ---------- createContractFromApplication ----------

export async function createContractFromApplication(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
      developer: { select: { id: true, name: true } },
    },
  });

  if (!application) return { error: "Application not found" };
  if (application.project.clientId !== session.user.id) {
    return { error: "Only the project owner can create contracts" };
  }
  if (application.status !== "ACCEPTED") {
    return { error: "Application must be accepted first" };
  }

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
    clientName: application.project.client.name ?? "Client",
    totalAmount,
    currency: application.project.currency,
  });

  const contract = await db.contract.create({
    data: {
      projectId: application.project.id,
      clientId: session.user.id,
      developerId: application.developerId,
      title: `Contract: ${application.project.title}`,
      terms: terms as Record<string, unknown>,
      totalAmount,
      currency: application.project.currency,
      status: "DRAFT",
    },
  });

  // Update project status
  await db.project.update({
    where: { id: application.project.id },
    data: { status: "IN_PROGRESS" },
  });

  // Notify developer
  await db.notification.create({
    data: {
      userId: application.developerId,
      type: "CONTRACT_READY",
      title: "Contract Ready",
      body: `A contract for "${application.project.title}" is ready for your review.`,
      link: `/dashboard/developer/projects/${contract.id}`,
    },
  });

  return { data: { id: contract.id } };
}

// ---------- signContract ----------

export async function signContract(contractId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) return { error: "Contract not found" };

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;
  if (!isClient && !isDeveloper) return { error: "Forbidden" };

  // Must be DRAFT or PENDING_SIGN
  if (contract.status !== "DRAFT" && contract.status !== "PENDING_SIGN") {
    return { error: "Contract cannot be signed in current status" };
  }

  const updateData: Record<string, unknown> = {};

  if (isClient) updateData.signedByClient = true;
  if (isDeveloper) updateData.signedByDeveloper = true;

  // Determine new status
  const willBeSignedByClient = isClient ? true : contract.signedByClient;
  const willBeSignedByDeveloper = isDeveloper ? true : contract.signedByDeveloper;

  if (willBeSignedByClient && willBeSignedByDeveloper) {
    updateData.status = "ACTIVE";
    updateData.signedAt = new Date();
  } else {
    updateData.status = "PENDING_SIGN";
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: updateData,
  });

  return { data: { id: updated.id, status: updated.status } };
}

// ---------- transitionContract ----------

export async function transitionContract(
  contractId: string,
  newStatus: string,
  reviewComment?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { title: true } } },
  });

  if (!contract) return { error: "Contract not found" };

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;
  if (!isClient && !isDeveloper) return { error: "Forbidden" };

  // Validate transition
  const allowed = validTransitions[contract.status];
  if (!allowed?.includes(newStatus)) {
    return { error: `Cannot transition from ${contract.status} to ${newStatus}` };
  }

  // Role-specific transition rules
  if (newStatus === "DELIVERED" && !isDeveloper) {
    return { error: "Only developer can mark as delivered" };
  }
  if (newStatus === "COMPLETED" && !isClient) {
    return { error: "Only client can accept delivery" };
  }
  if (newStatus === "ACTIVE" && contract.status === "DELIVERED" && !isClient) {
    return { error: "Only client can request revision" };
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: { status: newStatus as Contract["status"] },
  });

  // Notify counterparty
  const notifyUserId = isClient ? contract.developerId : contract.clientId;
  await db.notification.create({
    data: {
      userId: notifyUserId,
      type: "GENERAL",
      title: `Contract ${newStatus.toLowerCase().replace("_", " ")}`,
      body: `Contract for "${contract.project.title}" status changed to ${newStatus}.${reviewComment ? ` Note: ${reviewComment}` : ""}`,
      link: isClient
        ? `/dashboard/developer/projects/${contractId}`
        : `/dashboard/client/projects/${contract.projectId}`,
    },
  });

  return { data: { id: updated.id, status: updated.status } };
}

// ---------- getContract ----------

export async function getContract(contractId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      project: {
        select: { id: true, title: true, description: true, category: true },
      },
      client: { select: { id: true, name: true, avatar: true } },
      developer: { select: { id: true, name: true, avatar: true } },
      payments: { orderBy: { createdAt: "desc" } },
      deliverables: { orderBy: { createdAt: "desc" } },
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

// ---------- getMyContracts ----------

export async function getMyContracts(
  role: "client" | "developer"
): Promise<{ data?: ContractCardData[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const where =
    role === "client"
      ? { clientId: session.user.id }
      : { developerId: session.user.id };

  const contracts = await db.contract.findMany({
    where,
    include: {
      project: { select: { id: true, title: true } },
      client: { select: { name: true } },
      developer: { select: { name: true } },
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
```

- [ ] **Step 3: Create delivery server actions**

Create `src/lib/actions/delivery.ts`:

```typescript
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

// ---------- submitDeliverable ----------

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

  // Transition contract to DELIVERED
  await db.contract.update({
    where: { id: parsed.data.contractId },
    data: { status: "DELIVERED" },
  });

  // Notify client
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

// ---------- reviewDeliverable ----------

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
    // Transition contract back to ACTIVE for revision
    await db.contract.update({
      where: { id: deliverable.contractId },
      data: { status: "ACTIVE" },
    });
  }

  return { data: { success: true } };
}

// ---------- getContractDeliverables ----------

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
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add contract/delivery server actions and AI contract generator"
```

---

## Task 3: Stripe Integration (Checkout, Connect, Webhooks)

**Files:**
- Create: `src/lib/services/stripe.ts`
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/connect/route.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Install Stripe**

```bash
npm install stripe
```

- [ ] **Step 2: Create Stripe service**

Create `src/lib/services/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const PLATFORM_FEE_PERCENT = 10;

// ---------- Create Checkout Session (Escrow) ----------

export async function createCheckoutSession(opts: {
  contractId: string;
  amount: number;
  currency: string;
  clientEmail: string;
  projectTitle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: opts.clientEmail,
    line_items: [
      {
        price_data: {
          currency: opts.currency.toLowerCase(),
          unit_amount: Math.round(opts.amount * 100),
          product_data: {
            name: `Contract Payment: ${opts.projectTitle}`,
            description: `Contract ID: ${opts.contractId}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      capture_method: "manual", // Escrow: authorize but don't capture
      metadata: { contractId: opts.contractId },
    },
    metadata: { contractId: opts.contractId },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return session;
}

// ---------- Capture Payment (Release Escrow) ----------

export async function capturePayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

// ---------- Create Connect Account Onboarding Link ----------

export async function createConnectOnboardingLink(opts: {
  email: string;
  userId: string;
  returnUrl: string;
  refreshUrl: string;
}) {
  // Create Express account if needed
  const account = await stripe.accounts.create({
    type: "express",
    email: opts.email,
    metadata: { userId: opts.userId },
    capabilities: {
      transfers: { requested: true },
    },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    return_url: opts.returnUrl,
    refresh_url: opts.refreshUrl,
  });

  return { accountId: account.id, url: link.url };
}

// ---------- Transfer to Developer ----------

export async function transferToDeveloper(opts: {
  amount: number;
  currency: string;
  connectedAccountId: string;
  contractId: string;
}) {
  const fee = Math.round(opts.amount * (PLATFORM_FEE_PERCENT / 100) * 100);
  const transferAmount = Math.round(opts.amount * 100) - fee;

  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: opts.currency.toLowerCase(),
    destination: opts.connectedAccountId,
    metadata: { contractId: opts.contractId },
  });

  return transfer;
}
```

- [ ] **Step 3: Create Checkout API route**

Create `src/app/api/stripe/checkout/route.ts`:

```typescript
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await req.json();

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { title: true } } },
  });

  if (!contract) {
    return Response.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.clientId !== session.user.id) {
    return Response.json({ error: "Only the client can pay" }, { status: 403 });
  }
  if (contract.status !== "ACTIVE") {
    return Response.json(
      { error: "Contract must be signed before payment" },
      { status: 400 }
    );
  }

  const locale = session.user.locale || "en";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await createCheckoutSession({
    contractId: contract.id,
    amount: Number(contract.totalAmount),
    currency: contract.currency,
    clientEmail: session.user.email,
    projectTitle: contract.project.title,
    successUrl: `${baseUrl}/${locale}/dashboard/client/projects/${contract.projectId}?payment=success`,
    cancelUrl: `${baseUrl}/${locale}/dashboard/client/projects/${contract.projectId}?payment=cancelled`,
  });

  return Response.json({ url: checkoutSession.url });
}
```

- [ ] **Step 4: Create Connect onboarding route**

Create `src/app/api/stripe/connect/route.ts`:

```typescript
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createConnectOnboardingLink } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return Response.json(
      { error: "Developer profile required" },
      { status: 400 }
    );
  }

  // If already has Stripe Connect, return dashboard link
  if (profile.stripeConnectAccountId) {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripeConnectAccountId
    );
    return Response.json({ url: loginLink.url });
  }

  const locale = session.user.locale || "en";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { accountId, url } = await createConnectOnboardingLink({
    email: session.user.email,
    userId: session.user.id,
    returnUrl: `${baseUrl}/${locale}/dashboard/developer?stripe=success`,
    refreshUrl: `${baseUrl}/${locale}/dashboard/developer?stripe=refresh`,
  });

  // Save Connect account ID
  await db.developerProfile.update({
    where: { id: profile.id },
    data: { stripeConnectAccountId: accountId },
  });

  return Response.json({ url });
}
```

- [ ] **Step 5: Create Stripe webhook handler**

Create `src/app/api/webhooks/stripe/route.ts`:

```typescript
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { stripe, capturePayment, transferToDeveloper } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await db.processedWebhookEvent.findUnique({
    where: { providerEventId: event.id },
  });
  if (existing) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const contractId = session.metadata?.contractId;
        if (!contractId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        // Create payment record (HELD = escrow)
        await db.payment.create({
          data: {
            contractId,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency?.toUpperCase() ?? "USD",
            provider: "STRIPE",
            providerPaymentId: paymentIntentId ?? null,
            providerEventId: event.id,
            status: "HELD",
            paidAt: new Date(),
          },
        });

        // Notify
        const contract = await db.contract.findUnique({
          where: { id: contractId },
          select: { developerId: true, project: { select: { title: true } } },
        });
        if (contract) {
          await db.notification.create({
            data: {
              userId: contract.developerId,
              type: "PAYMENT_RECEIVED",
              title: "Payment Received (Escrow)",
              body: `Client has paid for "${contract.project.title}". Funds held in escrow.`,
              link: `/dashboard/developer/projects/${contractId}`,
            },
          });
        }
        break;
      }

      case "payment_intent.amount_capturable_updated": {
        // Payment authorized but not captured — funds available for capture
        break;
      }
    }

    // Mark event as processed
    await db.processedWebhookEvent.create({
      data: {
        providerEventId: event.id,
        provider: "STRIPE",
      },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add Stripe integration (checkout, connect, webhooks)"
```

---

## Task 4: Application & Contract UI Components

**Files:**
- Create: `src/components/application/application-form.tsx`
- Create: `src/components/application/application-list.tsx`
- Create: `src/components/contract/contract-view.tsx`
- Create: `src/components/contract/contract-actions.tsx`
- Create: `src/components/delivery/delivery-form.tsx`

- [ ] **Step 1: Create application form**

Create `src/components/application/application-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { applyToProject } from "@/lib/actions/application";

export function ApplicationForm({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await applyToProject({
      projectId,
      coverLetter: formData.get("coverLetter") as string || undefined,
      proposedRate: formData.get("proposedRate")
        ? Number(formData.get("proposedRate"))
        : undefined,
    });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <p className="text-accent-cyan font-medium py-4">
            Application submitted successfully!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to this Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">
              Cover Letter
            </label>
            <textarea
              name="coverLetter"
              rows={5}
              placeholder="Describe why you're a good fit for this project..."
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">
              Proposed Rate (USD/hr)
            </label>
            <Input
              name="proposedRate"
              type="number"
              min={0}
              step={0.01}
              placeholder="e.g. 80"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create application list**

Create `src/components/application/application-list.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/lib/actions/application";
import { createContractFromApplication } from "@/lib/actions/contract";
import type { ApplicationCardData } from "@/types/contract";

interface Props {
  applications: ApplicationCardData[];
  isOwner: boolean;
}

export function ApplicationList({ applications, isOwner }: Props) {
  const [items, setItems] = useState(applications);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(
    appId: string,
    action: "ACCEPTED" | "REJECTED" | "contract"
  ) {
    setLoading(appId);

    if (action === "contract") {
      const result = await createContractFromApplication(appId);
      if (!result.error) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: "CONTRACT_CREATED" } : a
          )
        );
      }
    } else {
      const result = await updateApplicationStatus({
        applicationId: appId,
        status: action,
      });
      if (!result.error) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: action } : a
          )
        );
      }
    }

    setLoading(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant py-4">
        No applications yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((app) => (
        <Card key={app.id}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-on-surface">
                  {app.developerName ?? "Anonymous"}
                </p>
                {app.proposedRate && (
                  <p className="text-sm text-on-surface-variant">
                    ${app.proposedRate}/hr
                  </p>
                )}
                {app.coverLetter && (
                  <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">
                    {app.coverLetter}
                  </p>
                )}
              </div>
              <span className="text-xs font-medium text-accent-cyan">
                {app.status}
              </span>
            </div>

            {isOwner && app.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(app.id, "ACCEPTED")}
                  disabled={loading === app.id}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(app.id, "REJECTED")}
                  disabled={loading === app.id}
                >
                  Reject
                </Button>
              </div>
            )}

            {isOwner && app.status === "ACCEPTED" && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => handleAction(app.id, "contract")}
                  disabled={loading === app.id}
                >
                  Create Contract
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create contract view**

Create `src/components/contract/contract-view.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ContractWithDetails } from "@/types/contract";

const statusColors: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  PENDING_SIGN: "bg-tertiary/10 text-tertiary",
  ACTIVE: "bg-accent-cyan/10 text-accent-cyan",
  DELIVERED: "bg-primary/10 text-primary",
  COMPLETED: "bg-primary/20 text-primary",
  DISPUTED: "bg-error/10 text-error",
  CANCELLED: "bg-error/20 text-error",
};

export function ContractView({ contract }: { contract: ContractWithDetails }) {
  const terms = contract.terms as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{contract.title}</CardTitle>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[contract.status] ?? ""}`}
          >
            {contract.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-on-surface-variant">Client</p>
            <p className="font-medium text-on-surface">
              {contract.client.name ?? "Anonymous"}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">Developer</p>
            <p className="font-medium text-on-surface">
              {contract.developer.name ?? "Anonymous"}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">Amount</p>
            <p className="font-medium text-on-surface">
              {contract.currency === "CNY" ? "\u00A5" : "$"}
              {Number(contract.totalAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">Signed</p>
            <p className="font-medium text-on-surface">
              Client: {contract.signedByClient ? "Yes" : "No"} / Dev:{" "}
              {contract.signedByDeveloper ? "Yes" : "No"}
            </p>
          </div>
        </div>

        {Object.entries(terms).map(([key, value]) => (
          <div key={key}>
            <h4 className="text-sm font-semibold text-on-surface capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </h4>
            <p className="mt-1 text-sm text-on-surface-variant">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create contract actions**

Create `src/components/contract/contract-actions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signContract, transitionContract } from "@/lib/actions/contract";

interface Props {
  contractId: string;
  status: string;
  isClient: boolean;
  isDeveloper: boolean;
  signedByClient: boolean;
  signedByDeveloper: boolean;
}

export function ContractActions({
  contractId,
  status,
  isClient,
  isDeveloper,
  signedByClient,
  signedByDeveloper,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    setLoading(true);
    await signContract(contractId);
    window.location.reload();
  }

  async function handleTransition(newStatus: string) {
    setLoading(true);
    await transitionContract(contractId, newStatus);
    window.location.reload();
  }

  async function handlePay() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  }

  const canSign =
    (status === "DRAFT" || status === "PENDING_SIGN") &&
    ((isClient && !signedByClient) || (isDeveloper && !signedByDeveloper));

  const canPay = status === "ACTIVE" && isClient;
  const canDeliver = status === "ACTIVE" && isDeveloper;
  const canAccept = status === "DELIVERED" && isClient;
  const canRequestRevision = status === "DELIVERED" && isClient;
  const canDispute =
    (status === "ACTIVE" || status === "DELIVERED") && (isClient || isDeveloper);

  return (
    <div className="flex flex-wrap gap-2">
      {canSign && (
        <Button onClick={handleSign} disabled={loading}>
          Sign Contract
        </Button>
      )}
      {canPay && (
        <Button onClick={handlePay} disabled={loading}>
          Pay (Escrow)
        </Button>
      )}
      {canDeliver && (
        <Button onClick={() => handleTransition("DELIVERED")} disabled={loading}>
          Mark as Delivered
        </Button>
      )}
      {canAccept && (
        <Button onClick={() => handleTransition("COMPLETED")} disabled={loading}>
          Accept & Release Payment
        </Button>
      )}
      {canRequestRevision && (
        <Button
          variant="secondary"
          onClick={() => handleTransition("ACTIVE")}
          disabled={loading}
        >
          Request Revision
        </Button>
      )}
      {canDispute && (
        <Button
          variant="destructive"
          onClick={() => handleTransition("DISPUTED")}
          disabled={loading}
        >
          Dispute
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create delivery form**

Create `src/components/delivery/delivery-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitDeliverable } from "@/lib/actions/delivery";

export function DeliveryForm({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitDeliverable({
      contractId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      fileUrl: (formData.get("fileUrl") as string) || undefined,
    });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <p className="text-accent-cyan font-medium py-4">
            Deliverable submitted! The client will be notified.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Deliverable</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">Title *</label>
            <Input name="title" required placeholder="e.g. Final RAG Chatbot v1.0" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe what you're delivering..."
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">File URL</label>
            <Input name="fileUrl" type="url" placeholder="https://github.com/..." className="mt-1" />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Deliverable"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add application, contract, and delivery UI components"
```

---

## Task 5: Dashboard Pages (Client Project Management, Developer Contracts & Earnings)

**Files:**
- Create: `src/app/[locale]/dashboard/client/projects/[id]/page.tsx`
- Create: `src/app/[locale]/dashboard/developer/projects/page.tsx`
- Create: `src/app/[locale]/dashboard/developer/projects/[id]/page.tsx`
- Create: `src/app/[locale]/dashboard/developer/earnings/page.tsx`

- [ ] **Step 1: Create client project management page**

Create `src/app/[locale]/dashboard/client/projects/[id]/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProjectApplications } from "@/lib/actions/application";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApplicationList } from "@/components/application/application-list";
import { ContractView } from "@/components/contract/contract-view";
import { ContractActions } from "@/components/contract/contract-actions";

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      skills: { include: { skillTag: true } },
      contracts: {
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          developer: { select: { id: true, name: true, avatar: true } },
          payments: { orderBy: { createdAt: "desc" } },
          deliverables: { orderBy: { createdAt: "desc" } },
          project: {
            select: { id: true, title: true, description: true, category: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project || project.clientId !== session.user.id) notFound();

  const applicationsResult = await getProjectApplications(id);
  const applications = applicationsResult.data ?? [];

  const contract = project.contracts[0] ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{project.title}</h1>
      <p className="text-sm text-on-surface-variant">{project.description}</p>

      {contract ? (
        <div className="space-y-4">
          <ContractView contract={contract} />
          <ContractActions
            contractId={contract.id}
            status={contract.status}
            isClient={true}
            isDeveloper={false}
            signedByClient={contract.signedByClient}
            signedByDeveloper={contract.signedByDeveloper}
          />

          {contract.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Deliverables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.deliverables.map((d) => (
                  <div key={d.id} className="rounded-lg bg-surface-container-lowest p-3 ghost-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-on-surface text-sm">{d.title}</p>
                        {d.description && (
                          <p className="mt-1 text-xs text-on-surface-variant">{d.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-accent-cyan">{d.status}</span>
                    </div>
                    {d.fileUrl && (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-accent-cyan underline"
                      >
                        View file
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-on-surface mb-4">
            Applications ({applications.length})
          </h2>
          <ApplicationList applications={applications} isOwner={true} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create developer contracts list page**

Create `src/app/[locale]/dashboard/developer/projects/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyContracts } from "@/lib/actions/contract";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function DeveloperProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const result = await getMyContracts("developer");
  const contracts = result.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">My Contracts</h1>

      {contracts.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">
            No contracts yet. Browse projects and apply!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link key={c.id} href={`/dashboard/developer/projects/${c.id}`}>
              <Card className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-on-surface">{c.title}</p>
                      <p className="text-sm text-on-surface-variant">
                        {c.projectTitle} &middot; {c.counterpartyName ?? "Client"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-on-surface">
                        ${c.totalAmount.toLocaleString()}
                      </p>
                      <span className="text-xs text-accent-cyan">{c.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create developer contract detail page**

Create `src/app/[locale]/dashboard/developer/projects/[id]/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getContract } from "@/lib/actions/contract";
import { ContractView } from "@/components/contract/contract-view";
import { ContractActions } from "@/components/contract/contract-actions";
import { DeliveryForm } from "@/components/delivery/delivery-form";

export default async function DeveloperContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const { id } = await params;
  const result = await getContract(id);

  if (result.error || !result.data) notFound();
  const contract = result.data;

  if (contract.developerId !== session.user.id) notFound();

  return (
    <div className="space-y-6">
      <ContractView contract={contract} />

      <ContractActions
        contractId={contract.id}
        status={contract.status}
        isClient={false}
        isDeveloper={true}
        signedByClient={contract.signedByClient}
        signedByDeveloper={contract.signedByDeveloper}
      />

      {contract.status === "ACTIVE" && (
        <DeliveryForm contractId={contract.id} />
      )}

      {contract.deliverables.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-on-surface">Deliverables</h3>
          {contract.deliverables.map((d) => (
            <div
              key={d.id}
              className="rounded-lg bg-surface-container-lowest p-3 ghost-border"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-on-surface text-sm">{d.title}</p>
                  {d.description && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {d.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-accent-cyan">{d.status}</span>
              </div>
              {d.reviewComment && (
                <p className="mt-2 text-xs text-error">
                  Review: {d.reviewComment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create developer earnings page**

Create `src/app/[locale]/dashboard/developer/earnings/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DeveloperEarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const contracts = await db.contract.findMany({
    where: { developerId: session.user.id },
    include: {
      payments: true,
      project: { select: { title: true } },
    },
  });

  const totalEarned = contracts
    .filter((c) => c.status === "COMPLETED")
    .reduce((sum, c) => sum + Number(c.totalAmount), 0);

  const totalHeld = contracts
    .flatMap((c) => c.payments)
    .filter((p) => p.status === "HELD")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripeConnectAccountId: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Earned" value={`$${totalEarned.toLocaleString()}`} subtitle="Released payments" />
        <StatsCard title="In Escrow" value={`$${totalHeld.toLocaleString()}`} subtitle="Pending release" />
        <StatsCard title="Completed Contracts" value={contracts.filter((c) => c.status === "COMPLETED").length} />
      </div>

      {!profile?.stripeConnectAccountId && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-on-surface">Set up payouts</p>
              <p className="text-sm text-on-surface-variant">
                Connect your Stripe account to receive payments.
              </p>
            </div>
            <form action="/api/stripe/connect" method="POST">
              <Button type="submit">Connect Stripe</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-on-surface">Payment History</h2>
        {contracts.flatMap((c) =>
          c.payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 ghost-border"
            >
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {c.project.title}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-on-surface">
                  ${Number(p.amount).toLocaleString()}
                </p>
                <span className="text-xs text-accent-cyan">{p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update developer sidebar to include new links**

Modify `src/components/dashboard/developer-sidebar.tsx` — add "My Contracts" and "Earnings" links.

- [ ] **Step 6: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add dashboard pages for project management, contracts, and earnings"
```

---

## Task 6: Update Public Project Detail with Apply Button + Release Payment on Accept

**Files:**
- Modify: `src/app/[locale]/(public)/projects/[id]/page.tsx` — add ApplicationForm for authenticated developers
- Modify: `src/lib/actions/contract.ts` — add payment release logic when completing contract

- [ ] **Step 1: Update project detail page with apply form**

In `src/app/[locale]/(public)/projects/[id]/page.tsx`, replace the static "Apply" button with the `ApplicationForm` component for authenticated developers.

- [ ] **Step 2: Add payment release on contract completion**

In `transitionContract`, when transitioning to `COMPLETED`, find the HELD payment and capture it via Stripe, then transfer to developer's connected account.

- [ ] **Step 3: Verify full build and commit**

```bash
npm run build
git add .
git commit -m "feat: add apply button on project detail and payment release on completion"
git push origin main
```

---

## Summary

After completing this plan:
- **Applications** — developers apply to published projects with cover letter + proposed rate
- **Contracts** — AI-generated terms, dual-party signing, state machine transitions
- **Stripe Checkout** — escrow payment (manual capture), held until delivery accepted
- **Stripe Connect** — developer onboarding for payouts
- **Webhook handler** — idempotent processing of Stripe events
- **Delivery system** — submit deliverable, client review (accept/reject/revision)
- **Client dashboard** — project management with applications, contract, deliverables
- **Developer dashboard** — contracts list, contract detail with delivery form, earnings overview
- **Notifications** — in-app notifications for all key events
- Ready for Plan 5 (Dashboard polish, notifications UI, landing page, final integration)
