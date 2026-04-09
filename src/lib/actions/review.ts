"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitReviewSchema } from "@/lib/validators/review";
import {
  CLIENT_TO_DEVELOPER_TAGS,
  DEVELOPER_TO_CLIENT_TAGS,
} from "@/lib/review-tags";

export async function submitReview(data: {
  contractId: string;
  rating: number;
  tags: string[];
  comment?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = submitReviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const contract = await db.contract.findUnique({
    where: { id: parsed.data.contractId },
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
  if (contract.status !== "COMPLETED") {
    return { error: "Contract must be completed to submit a review" };
  }

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;

  if (!isClient && !isDeveloper) {
    return { error: "You are not a party to this contract" };
  }

  const allowedTags = isClient
    ? CLIENT_TO_DEVELOPER_TAGS
    : DEVELOPER_TO_CLIENT_TAGS;
  const invalidTags = parsed.data.tags.filter(
    (tag) => !(allowedTags as readonly string[]).includes(tag)
  );
  if (invalidTags.length > 0) {
    return { error: "Invalid tags for your role" };
  }

  const existing = await db.review.findUnique({
    where: {
      contractId_reviewerId: {
        contractId: parsed.data.contractId,
        reviewerId: session.user.id,
      },
    },
  });
  if (existing) return { error: "You have already reviewed this contract" };

  const reviewerRole = isClient ? "CLIENT" : "DEVELOPER";
  const revieweeId = isClient ? contract.developerId : contract.clientId;

  await db.review.create({
    data: {
      contractId: parsed.data.contractId,
      reviewerId: session.user.id,
      revieweeId,
      reviewerRole,
      rating: parsed.data.rating,
      tags: parsed.data.tags,
      comment: parsed.data.comment ?? null,
    },
  });

  revalidatePath(`/dashboard/client/projects/${contract.projectId}`);
  revalidatePath(`/dashboard/developer/projects/${contract.id}`);

  return { data: { success: true } };
}

export async function getContractReviews(contractId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { clientId: true, developerId: true },
  });

  if (!contract) return { error: "Contract not found" };

  const isClient = contract.clientId === session.user.id;
  const isDeveloper = contract.developerId === session.user.id;

  if (!isClient && !isDeveloper) return { error: "Forbidden" };

  const reviews = await db.review.findMany({
    where: { contractId },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const submitted = reviews.some((r) => r.reviewerId === session.user.id);
  const revealed = reviews.length >= 2;

  if (!revealed) {
    return {
      data: {
        submitted,
        revealed: false,
        reviews: [],
      },
    };
  }

  return {
    data: {
      submitted: true,
      revealed: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewerRole: r.reviewerRole,
        reviewerName: r.reviewer.name,
        reviewerAvatar: r.reviewer.avatar,
        rating: r.rating,
        tags: r.tags as string[],
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

export async function getDeveloperReviews(developerId: string) {
  const allReviews = await db.review.findMany({
    where: { revieweeId: developerId, reviewerRole: "CLIENT" },
    include: {
      reviewer: { select: { name: true, avatar: true } },
      contract: {
        select: {
          _count: { select: { reviews: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const revealedReviews = allReviews.filter(
    (r) => r.contract._count.reviews >= 2
  );

  const totalReviews = revealedReviews.length;
  const averageRating =
    totalReviews > 0
      ? revealedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const tagCounts: Record<string, number> = {};
  for (const r of revealedReviews) {
    for (const tag of r.tags as string[]) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    data: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      topTags,
      reviews: revealedReviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewer.name,
        reviewerAvatar: r.reviewer.avatar,
        rating: r.rating,
        tags: r.tags as string[],
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}
