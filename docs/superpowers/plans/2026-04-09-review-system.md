# Review System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bidirectional review system where clients and developers rate each other after contract completion, with simultaneous reveal.

**Architecture:** New `Review` Prisma model with JSON tags. Server actions handle submission + reveal logic. Three new client components (`ReviewForm`, `ReviewCard`, `ReviewSummary`) embedded in existing contract detail pages and developer profile page.

**Tech Stack:** Prisma 7, Next.js 16 Server Actions, Zod, next-intl, Tailwind CSS, Radix-style UI components

---

### Task 1: Database Schema — Add Review Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add ReviewerRole enum and Review model to schema**

In `prisma/schema.prisma`, add after the `Deliverable` model section (before the Notifications section):

```prisma
// ==================== Reviews ====================

enum ReviewerRole {
  CLIENT
  DEVELOPER
}

model Review {
  id           String       @id @default(cuid())
  contractId   String
  reviewerId   String
  revieweeId   String
  reviewerRole ReviewerRole
  rating       Int
  tags         Json
  comment      String?      @db.Text
  createdAt    DateTime     @default(now())

  contract Contract @relation(fields: [contractId], references: [id])
  reviewer User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  reviewee User     @relation("ReviewsReceived", fields: [revieweeId], references: [id])

  @@unique([contractId, reviewerId])
  @@index([revieweeId, createdAt])
}
```

- [ ] **Step 2: Add Review relations to User model**

In the `User` model, add these two lines after the `notifications` relation:

```prisma
  reviewsGiven    Review[]  @relation("ReviewsGiven")
  reviewsReceived Review[]  @relation("ReviewsReceived")
```

- [ ] **Step 3: Add Review relation to Contract model**

In the `Contract` model, add after the `deliverables` relation:

```prisma
  reviews      Review[]
```

- [ ] **Step 4: Add REVIEW_REQUESTED to NotificationType enum**

In the `NotificationType` enum, add `REVIEW_REQUESTED` after `DELIVERY_SUBMITTED`:

```prisma
enum NotificationType {
  PROJECT_INVITE
  APPLICATION_RECEIVED
  APPLICATION_ACCEPTED
  CONTRACT_READY
  PAYMENT_RECEIVED
  DELIVERY_SUBMITTED
  REVIEW_REQUESTED
  GENERAL
}
```

- [ ] **Step 5: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 6: Create migration**

Run: `npx prisma migrate dev --name add-review-system`
Expected: Migration created and applied successfully

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Review model and REVIEW_REQUESTED notification type"
```

---

### Task 2: Review Constants and Validator

**Files:**
- Create: `src/lib/review-tags.ts`
- Create: `src/lib/validators/review.ts`

- [ ] **Step 1: Create review tag constants**

Create `src/lib/review-tags.ts`:

```typescript
export const CLIENT_TO_DEVELOPER_TAGS = [
  "code_quality",
  "good_communication",
  "on_time_delivery",
  "exceeded_expectations",
  "fast_response",
] as const;

export const DEVELOPER_TO_CLIENT_TAGS = [
  "clear_requirements",
  "good_collaboration",
  "timely_payment",
  "respects_expertise",
  "prompt_feedback",
] as const;

export type ClientTag = (typeof CLIENT_TO_DEVELOPER_TAGS)[number];
export type DeveloperTag = (typeof DEVELOPER_TO_CLIENT_TAGS)[number];
export type ReviewTag = ClientTag | DeveloperTag;

export const ALL_REVIEW_TAGS = [
  ...CLIENT_TO_DEVELOPER_TAGS,
  ...DEVELOPER_TO_CLIENT_TAGS,
] as const;
```

- [ ] **Step 2: Create Zod validator for reviews**

Create `src/lib/validators/review.ts`:

```typescript
import { z } from "zod";
import { ALL_REVIEW_TAGS } from "@/lib/review-tags";

export const submitReviewSchema = z.object({
  contractId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z
    .array(z.enum(ALL_REVIEW_TAGS))
    .min(0)
    .max(5),
  comment: z.string().max(500).optional(),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/review-tags.ts src/lib/validators/review.ts
git commit -m "feat: add review tag constants and Zod validator"
```

---

### Task 3: Server Actions — submitReview, getContractReviews, getDeveloperReviews

**Files:**
- Create: `src/lib/actions/review.ts`

- [ ] **Step 1: Create review server actions**

Create `src/lib/actions/review.ts`:

```typescript
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

  // Validate tags match the reviewer's role
  const allowedTags = isClient
    ? CLIENT_TO_DEVELOPER_TAGS
    : DEVELOPER_TO_CLIENT_TAGS;
  const invalidTags = parsed.data.tags.filter(
    (tag) => !(allowedTags as readonly string[]).includes(tag)
  );
  if (invalidTags.length > 0) {
    return { error: "Invalid tags for your role" };
  }

  // Check if already reviewed
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
  // Get all reviews where this developer is the reviewee,
  // but only from contracts where both parties have reviewed (revealed)
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

  // Only include revealed reviews (both parties submitted)
  const revealedReviews = allReviews.filter(
    (r) => r.contract._count.reviews >= 2
  );

  const totalReviews = revealedReviews.length;
  const averageRating =
    totalReviews > 0
      ? revealedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // Calculate tag frequency
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/review.ts
git commit -m "feat: add review server actions with simultaneous reveal logic"
```

---

### Task 4: Add REVIEW_REQUESTED Notification on Contract Completion

**Files:**
- Modify: `src/lib/actions/contract.ts`

- [ ] **Step 1: Add review notifications to transitionContract**

In `src/lib/actions/contract.ts`, inside the `transitionContract` function, find the block after `if (newStatus === "COMPLETED") {` where the project is updated to COMPLETED. After the line `await db.project.update(...)`, add:

```typescript
    // Notify both parties to leave reviews
    await db.notification.createMany({
      data: [
        {
          userId: contract.clientId,
          type: "REVIEW_REQUESTED",
          title: "Leave a Review",
          body: `Contract for "${contract.project.title}" is completed. Share your experience!`,
          link: `/dashboard/client/projects/${contract.projectId}`,
        },
        {
          userId: contract.developerId,
          type: "REVIEW_REQUESTED",
          title: "Leave a Review",
          body: `Contract for "${contract.project.title}" is completed. Share your experience!`,
          link: `/dashboard/developer/projects/${contract.id}`,
        },
      ],
    });
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/contract.ts
git commit -m "feat: send REVIEW_REQUESTED notifications on contract completion"
```

---

### Task 5: i18n — Add Review Translations

**Files:**
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/zh.json`

- [ ] **Step 1: Add review namespace to en.json**

Add the following after the `"applicationForm"` section in `src/i18n/messages/en.json`:

```json
  "review": {
    "sectionTitle": "Reviews",
    "submitTitle": "Rate Your Experience",
    "ratingLabel": "Overall Rating",
    "tagsLabel": "Quick Tags (select up to 5)",
    "commentLabel": "Written Review (optional)",
    "commentPlaceholder": "Share your experience...",
    "submitting": "Submitting...",
    "submitButton": "Submit Review",
    "submitted": "Review submitted! It will be visible once the other party submits theirs.",
    "waitingReveal": "Your review has been submitted. It will be visible once the other party submits their review.",
    "averageRating": "Average Rating",
    "totalReviews": "{count, plural, =0 {No reviews yet} one {# review} other {# reviews}}",
    "noReviews": "No reviews yet",
    "star1": "Poor",
    "star2": "Fair",
    "star3": "Good",
    "star4": "Very Good",
    "star5": "Excellent",
    "tagCodeQuality": "High Code Quality",
    "tagGoodCommunication": "Good Communication",
    "tagOnTimeDelivery": "On-Time Delivery",
    "tagExceededExpectations": "Exceeded Expectations",
    "tagFastResponse": "Fast Response",
    "tagClearRequirements": "Clear Requirements",
    "tagGoodCollaboration": "Good Collaboration",
    "tagTimelyPayment": "Timely Payment",
    "tagRespectsExpertise": "Respects Expertise",
    "tagPromptFeedback": "Prompt Feedback"
  }
```

- [ ] **Step 2: Add review namespace to zh.json**

Add the same section in `src/i18n/messages/zh.json`:

```json
  "review": {
    "sectionTitle": "评价",
    "submitTitle": "评价你的体验",
    "ratingLabel": "综合评分",
    "tagsLabel": "快捷标签（最多选5个）",
    "commentLabel": "文字评价（可选）",
    "commentPlaceholder": "分享你的合作体验...",
    "submitting": "提交中...",
    "submitButton": "提交评价",
    "submitted": "评价已提交！待对方提交后双方评价将同时公开。",
    "waitingReveal": "你的评价已提交，待对方评价后将同时公开。",
    "averageRating": "平均评分",
    "totalReviews": "{count, plural, =0 {暂无评价} other {# 条评价}}",
    "noReviews": "暂无评价",
    "star1": "很差",
    "star2": "较差",
    "star3": "一般",
    "star4": "很好",
    "star5": "非常好",
    "tagCodeQuality": "代码质量高",
    "tagGoodCommunication": "沟通顺畅",
    "tagOnTimeDelivery": "交付准时",
    "tagExceededExpectations": "超出预期",
    "tagFastResponse": "响应迅速",
    "tagClearRequirements": "需求清晰",
    "tagGoodCollaboration": "沟通配合好",
    "tagTimelyPayment": "付款及时",
    "tagRespectsExpertise": "尊重专业意见",
    "tagPromptFeedback": "反馈及时"
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/messages/en.json src/i18n/messages/zh.json
git commit -m "feat: add review i18n translations for en and zh"
```

---

### Task 6: Component — ReviewForm

**Files:**
- Create: `src/components/review/review-form.tsx`

- [ ] **Step 1: Create ReviewForm component**

Create `src/components/review/review-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitReview } from "@/lib/actions/review";
import {
  CLIENT_TO_DEVELOPER_TAGS,
  DEVELOPER_TO_CLIENT_TAGS,
} from "@/lib/review-tags";

const TAG_I18N_MAP: Record<string, string> = {
  code_quality: "tagCodeQuality",
  good_communication: "tagGoodCommunication",
  on_time_delivery: "tagOnTimeDelivery",
  exceeded_expectations: "tagExceededExpectations",
  fast_response: "tagFastResponse",
  clear_requirements: "tagClearRequirements",
  good_collaboration: "tagGoodCollaboration",
  timely_payment: "tagTimelyPayment",
  respects_expertise: "tagRespectsExpertise",
  prompt_feedback: "tagPromptFeedback",
};

const STAR_LABELS = ["star1", "star2", "star3", "star4", "star5"] as const;

export function ReviewForm({
  contractId,
  isClient,
}: {
  contractId: string;
  isClient: boolean;
}) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const tags = isClient
    ? CLIENT_TO_DEVELOPER_TAGS
    : DEVELOPER_TO_CLIENT_TAGS;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    );
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError("");

    const result = await submitReview({
      contractId,
      rating,
      tags: selectedTags,
      comment: comment.trim() || undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-accent-cyan/10 p-6 text-center">
        <p className="text-sm font-medium text-accent-cyan">{t("submitted")}</p>
      </div>
    );
  }

  const displayStar = hoveredStar || rating;

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border space-y-6">
      <h3 className="text-sm font-black text-on-surface uppercase tracking-[0.15em]">
        {t("submitTitle")}
      </h3>

      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("ratingLabel")}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= displayStar
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-on-surface-variant/20 fill-on-surface-variant/20"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {displayStar > 0 && (
            <span className="ml-2 text-sm font-medium text-on-surface-variant">
              {t(STAR_LABELS[displayStar - 1])}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("tagsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-accent-cyan text-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t(TAG_I18N_MAP[tag])}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("commentLabel")}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-xl bg-surface-container p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
        />
        <p className="text-right text-xs text-on-surface-variant/50">
          {comment.length}/500
        </p>
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-primary text-on-primary hover:bg-primary/90 h-12 rounded-xl font-bold"
      >
        {submitting ? t("submitting") : t("submitButton")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/review/review-form.tsx
git commit -m "feat: add ReviewForm component with star rating, tags, and comment"
```

---

### Task 7: Component — ReviewCard

**Files:**
- Create: `src/components/review/review-card.tsx`

- [ ] **Step 1: Create ReviewCard component**

Create `src/components/review/review-card.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";

const TAG_I18N_MAP: Record<string, string> = {
  code_quality: "tagCodeQuality",
  good_communication: "tagGoodCommunication",
  on_time_delivery: "tagOnTimeDelivery",
  exceeded_expectations: "tagExceededExpectations",
  fast_response: "tagFastResponse",
  clear_requirements: "tagClearRequirements",
  good_collaboration: "tagGoodCollaboration",
  timely_payment: "tagTimelyPayment",
  respects_expertise: "tagRespectsExpertise",
  prompt_feedback: "tagPromptFeedback",
};

export type ReviewCardData = {
  id: string;
  reviewerRole?: string;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  rating: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
};

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const t = useTranslations("review");

  const initial = review.reviewerName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 ghost-border space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {review.reviewerAvatar ? (
            <img
              src={review.reviewerAvatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">
            {review.reviewerName ?? "Anonymous"}
          </p>
          <p className="text-xs text-on-surface-variant">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-on-surface-variant/20 fill-on-surface-variant/20"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-accent-cyan/10 px-3 py-1 text-xs font-bold text-accent-cyan"
            >
              {TAG_I18N_MAP[tag] ? t(TAG_I18N_MAP[tag]) : tag}
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/review/review-card.tsx
git commit -m "feat: add ReviewCard component for displaying reviews"
```

---

### Task 8: Component — ReviewSummary

**Files:**
- Create: `src/components/review/review-summary.tsx`

- [ ] **Step 1: Create ReviewSummary component**

Create `src/components/review/review-summary.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ReviewCard, type ReviewCardData } from "./review-card";

const TAG_I18N_MAP: Record<string, string> = {
  code_quality: "tagCodeQuality",
  good_communication: "tagGoodCommunication",
  on_time_delivery: "tagOnTimeDelivery",
  exceeded_expectations: "tagExceededExpectations",
  fast_response: "tagFastResponse",
  clear_requirements: "tagClearRequirements",
  good_collaboration: "tagGoodCollaboration",
  timely_payment: "tagTimelyPayment",
  respects_expertise: "tagRespectsExpertise",
  prompt_feedback: "tagPromptFeedback",
};

type ReviewSummaryProps = {
  averageRating: number;
  totalReviews: number;
  topTags: { tag: string; count: number }[];
  reviews: ReviewCardData[];
};

export function ReviewSummary({
  averageRating,
  totalReviews,
  topTags,
  reviews,
}: ReviewSummaryProps) {
  const t = useTranslations("review");

  if (totalReviews === 0) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border text-center">
        <p className="text-sm text-on-surface-variant">{t("noReviews")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border">
        <div className="flex items-center gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <p className="text-4xl font-black text-on-surface">
              {averageRating.toFixed(1)}
            </p>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-on-surface-variant/20 fill-on-surface-variant/20"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              {t("totalReviews", { count: totalReviews })}
            </p>
          </div>

          {/* Top Tags */}
          {topTags.length > 0 && (
            <div className="flex-1 flex flex-wrap gap-2">
              {topTags.map(({ tag, count }) => (
                <span
                  key={tag}
                  className="rounded-xl bg-accent-cyan/10 px-3 py-1.5 text-xs font-bold text-accent-cyan"
                >
                  {TAG_I18N_MAP[tag] ? t(TAG_I18N_MAP[tag]) : tag}
                  <span className="ml-1 opacity-60">({count})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/review/review-summary.tsx
git commit -m "feat: add ReviewSummary component with average rating and tag stats"
```

---

### Task 9: Component — ReviewSection (Container for Contract Pages)

**Files:**
- Create: `src/components/review/review-section.tsx`

- [ ] **Step 1: Create ReviewSection container component**

This component loads review data and conditionally shows the form or cards. Create `src/components/review/review-section.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getContractReviews } from "@/lib/actions/review";
import { ReviewForm } from "./review-form";
import { ReviewCard, type ReviewCardData } from "./review-card";

type ReviewState = {
  submitted: boolean;
  revealed: boolean;
  reviews: ReviewCardData[];
};

export function ReviewSection({
  contractId,
  contractStatus,
  isClient,
}: {
  contractId: string;
  contractStatus: string;
  isClient: boolean;
}) {
  const t = useTranslations("review");
  const [state, setState] = useState<ReviewState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractStatus !== "COMPLETED") {
      setLoading(false);
      return;
    }

    getContractReviews(contractId).then((result) => {
      if (result.data) {
        setState(result.data);
      }
      setLoading(false);
    });
  }, [contractId, contractStatus]);

  if (contractStatus !== "COMPLETED") return null;
  if (loading) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.15em]">
        {t("sectionTitle")}
      </h2>

      {state?.revealed ? (
        <div className="space-y-3">
          {state.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : state?.submitted ? (
        <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border text-center">
          <p className="text-sm text-on-surface-variant">
            {t("waitingReveal")}
          </p>
        </div>
      ) : (
        <ReviewForm contractId={contractId} isClient={isClient} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/review/review-section.tsx
git commit -m "feat: add ReviewSection container with reveal state management"
```

---

### Task 10: Integrate ReviewSection into Contract Detail Pages

**Files:**
- Modify: `src/app/[locale]/dashboard/client/projects/[id]/page.tsx`
- Modify: `src/app/[locale]/dashboard/developer/projects/[id]/page.tsx`

- [ ] **Step 1: Add ReviewSection to client project detail page**

In `src/app/[locale]/dashboard/client/projects/[id]/page.tsx`, add import at the top:

```typescript
import { ReviewSection } from "@/components/review/review-section";
```

Then, inside the `{contract ? (` block, after the `</Card>` closing tag for deliverables (after line 87 `)}`) and before the closing `</div>` of the contract block, add:

```tsx
          <ReviewSection
            contractId={contract.id}
            contractStatus={contract.status}
            isClient={true}
          />
```

- [ ] **Step 2: Add ReviewSection to developer contract detail page**

In `src/app/[locale]/dashboard/developer/projects/[id]/page.tsx`, add import at the top:

```typescript
import { ReviewSection } from "@/components/review/review-section";
```

Then, after the deliverables listing block (after line 63 `)}`) and before the closing `</div>` of the page, add:

```tsx
      <ReviewSection
        contractId={contract.id}
        contractStatus={contract.status}
        isClient={false}
      />
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/client/projects/[id]/page.tsx src/app/[locale]/dashboard/developer/projects/[id]/page.tsx
git commit -m "feat: integrate ReviewSection into client and developer contract pages"
```

---

### Task 11: Integrate ReviewSummary into Developer Public Profile

**Files:**
- Modify: `src/app/[locale]/(public)/developers/[id]/page.tsx`

- [ ] **Step 1: Add ReviewSummary to developer profile page**

In `src/app/[locale]/(public)/developers/[id]/page.tsx`, add imports at the top:

```typescript
import { getDeveloperReviews } from "@/lib/actions/review";
import { ReviewSummary } from "@/components/review/review-summary";
```

After the `profile` query (after the `if (!profile) notFound();` line), add:

```typescript
  const reviewsResult = await getDeveloperReviews(profile.userId);
  const reviewData = reviewsResult.data;
```

Then, after the Skills section closing `</div>` (after line 94 `)}`) and before the closing `</div>` of `lg:col-span-2`, add:

```tsx
          {/* Reviews */}
          {reviewData && (
            <div className="space-y-6">
              <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">
                {t("reviews")}
              </h2>
              <ReviewSummary
                averageRating={reviewData.averageRating}
                totalReviews={reviewData.totalReviews}
                topTags={reviewData.topTags}
                reviews={reviewData.reviews}
              />
            </div>
          )}
```

Also add a `"reviews"` translation key. In `src/i18n/messages/en.json` under the `"developers"` namespace, add:

```json
"reviews": "Reviews"
```

In `src/i18n/messages/zh.json` under the `"developers"` namespace, add:

```json
"reviews": "评价"
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/developers/[id]/page.tsx src/i18n/messages/en.json src/i18n/messages/zh.json
git commit -m "feat: show review summary and list on developer public profile"
```

---

### Task 12: Lint and Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run linter**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run full build**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 4: Fix any issues found in steps 1-3, then commit fixes if needed**

```bash
git add -A
git commit -m "fix: resolve lint and type errors in review system"
```
