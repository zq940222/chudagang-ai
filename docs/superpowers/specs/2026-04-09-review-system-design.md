# Review System Design

> Date: 2026-04-09
> Status: Approved

## Overview

Bidirectional review system for the ChuDaGang AI marketplace. After a contract is completed, both the client and developer can rate and review each other. Reviews use a "simultaneous reveal" mechanism — both parties must submit before either can see the other's review.

## Data Model

### New Enum

```prisma
enum ReviewerRole {
  CLIENT
  DEVELOPER
}
```

### New Model: Review

```prisma
model Review {
  id           String       @id @default(cuid())
  contractId   String
  reviewerId   String
  revieweeId   String
  reviewerRole ReviewerRole
  rating       Int          // 1-5
  tags         Json         // string[] of predefined tag keys
  comment      String?      @db.Text
  createdAt    DateTime     @default(now())

  contract Contract @relation(fields: [contractId], references: [id])
  reviewer User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  reviewee User     @relation("ReviewsReceived", fields: [revieweeId], references: [id])

  @@unique([contractId, reviewerId])
  @@index([revieweeId, createdAt])
}
```

### Existing Model Changes

**Contract** — add relation: `reviews Review[]`

**User** — add two relations:
- `reviewsGiven Review[] @relation("ReviewsGiven")`
- `reviewsReceived Review[] @relation("ReviewsReceived")`

**NotificationType** — add `REVIEW_REQUESTED`

## Predefined Tags

Tags are stored as English keys in the database. Display text is resolved via i18n.

### Client → Developer Tags

| Key | zh | en |
|-----|----|----|
| `code_quality` | 代码质量高 | High Code Quality |
| `good_communication` | 沟通顺畅 | Good Communication |
| `on_time_delivery` | 交付准时 | On-Time Delivery |
| `exceeded_expectations` | 超出预期 | Exceeded Expectations |
| `fast_response` | 响应迅速 | Fast Response |

### Developer → Client Tags

| Key | zh | en |
|-----|----|----|
| `clear_requirements` | 需求清晰 | Clear Requirements |
| `good_collaboration` | 沟通配合好 | Good Collaboration |
| `timely_payment` | 付款及时 | Timely Payment |
| `respects_expertise` | 尊重专业意见 | Respects Expertise |
| `prompt_feedback` | 反馈及时 | Prompt Feedback |

## Simultaneous Reveal Logic

1. When querying reviews for a contract, count how many Review records exist for that contractId.
2. If count < 2: the review content is NOT returned to the frontend. Only return `{ submitted: boolean, revealed: false }`.
3. If count == 2: return both reviews with full content, `{ submitted: true, revealed: true, reviews: [...] }`.
4. This logic is enforced server-side — unrevealed review content never leaves the server.

## Business Rules

### Submission Rules
- Only allowed when contract status is `COMPLETED`
- Reviewer must be the client or developer on the contract
- Each user can submit exactly one review per contract (enforced by `@@unique([contractId, reviewerId])`)
- Once submitted, reviews cannot be edited or deleted

### Validation (Zod)
- `rating`: integer, 1-5
- `tags`: array of predefined tag keys (max 5), validated against the reviewer's role-specific tag set
- `comment`: optional string, max 500 characters

### Dispute (Phase 2)
- Not implemented in this phase
- Future: `ReviewDispute` model + Admin UI for handling appeals

## Notification

When a contract transitions to `COMPLETED`:
- Send `REVIEW_REQUESTED` notification to both client and developer
- Link points to the contract detail page

## Server Actions

### `submitReview(contractId, rating, tags, comment)`
1. Authenticate user
2. Fetch contract, verify status is `COMPLETED`
3. Verify user is client or developer on the contract
4. Check no existing review from this user for this contract
5. Determine `reviewerRole` and `revieweeId` from contract
6. Validate input with Zod schema
7. Create Review record
8. Return `{ success: true }`

### `getContractReviews(contractId)`
1. Authenticate user
2. Verify user is client or developer on the contract
3. Fetch all reviews for the contract
4. If count < 2: return `{ submitted: boolean, revealed: false }`
5. If count == 2: return `{ submitted: true, revealed: true, reviews: [...] }`

### `getDeveloperReviews(developerId)`
1. Fetch all revealed reviews where `revieweeId` matches and the reviewer is a CLIENT
2. Only include reviews from contracts where both parties have reviewed (revealed)
3. Calculate average rating
4. Calculate tag frequency (top 5)
5. Return `{ averageRating, totalReviews, topTags, reviews }`

## Components

### `ReviewForm`
- Star rating selector (1-5, interactive)
- Tag multi-select chips (role-appropriate tags, max 5)
- Optional textarea for comment (max 500 chars)
- Submit button
- Shown on contract detail page when contract is `COMPLETED` and user has not yet reviewed

### `ReviewCard`
- Displays: reviewer avatar/name, star rating, tag badges, comment text, date
- Used in contract detail page (after reveal) and developer profile page

### `ReviewSummary`
- Average star rating (with visual stars)
- Total review count
- Top 5 tag frequency badges with counts
- Used on developer public profile page

## Page Changes

### Contract Detail Page (Client + Developer dashboards)
- After `COMPLETED`: show review section
  - Not submitted → `ReviewForm`
  - Submitted but not revealed → "Your review has been submitted. It will be visible once the other party submits their review."
  - Both submitted (revealed) → Two `ReviewCard` components

### Developer Public Profile Page
- New section at bottom: `ReviewSummary` + paginated list of `ReviewCard`s
- Only shows revealed reviews from clients

## i18n

New namespace `review` in both `zh.json` and `en.json`:
- Tag display names (10 tags × 2 languages)
- UI strings: form labels, placeholders, waiting message, section titles
- Star rating labels (e.g., "1 star - Poor", "5 stars - Excellent")

## Security

- Server-side reveal enforcement: unrevealed review content never sent to frontend
- Role validation: only contract participants can submit or view reviews
- Input sanitization via Zod schema
- Rate limiting on submitReview to prevent abuse (standard API rate limit)
