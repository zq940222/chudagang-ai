# 杵大岗AI (ChuDaGang AI) — AI Developer Marketplace Design Spec

## 1. Overview

**杵大岗AI (ChuDaGang AI)** is an AI-powered marketplace connecting employers with AI developers. Unlike traditional freelancing platforms (Freelancer, 程序员客栈), 杵大岗AI (ChuDaGang AI) replaces human customer service with an AI Agent that handles the complete workflow: pre-sales consultation, project scoping, developer matching, contract generation, payment, and delivery management.

### Core Differentiator
- **AI-First Experience**: Employers chat with AI to describe needs; AI extracts structured requirements, recommends matching developers, and automates contract/payment flow.
- **Zero Human Customer Service**: The entire pre-sales → order → contract → payment → delivery pipeline is AI-driven.

### Target Users
- **Employers (Clients)**: Companies or individuals needing AI development services
- **AI Developers**: Freelance or agency developers specializing in AI/ML projects

### Language
- Bilingual: Chinese (zh) and English (en), with `next-intl` for internationalization

---

## 2. Architecture

### Approach: Full Next.js Monolith
Single Next.js codebase deployed on Vercel, handling both frontend and backend.

```
Vercel Edge Network (CDN + Edge Middleware)
    │
    ▼
Next.js App Router
    ├── Pages (RSC + Client Components)
    ├── Server Actions (Form handling)
    ├── API Routes (Webhooks, Streaming)
    └── Server Components (SSR)
         │
         ▼
    Shared Service Layer
    ├── AI Orchestrator (multi-model gateway)
    ├── Payment Service (Stripe + Alipay/WeChat)
    ├── Contract State Machine
    └── Matching Engine
         │
         ▼
    External Services
    ├── LLM Gateway (Claude / GPT / Qwen / Custom)
    ├── Stripe + Alipay + WeChat Pay
    ├── Supabase PostgreSQL + Realtime
    ├── Upstash Redis (Cache / Queue / Rate Limit)
    ├── Supabase Storage (Files / Docs)
    └── NextAuth.js (Email + Google + GitHub OAuth)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, RSC, Server Actions) |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | Supabase PostgreSQL |
| Cache / Queue | Upstash Redis |
| Auth | NextAuth.js v5 (Email + Google + GitHub) |
| AI | Vercel AI SDK + multi-model Gateway |
| Payment | Stripe + Ping++ (Alipay/WeChat — Phase 2) |
| Realtime | Supabase Realtime |
| i18n | next-intl (zh / en) |
| UI | Tailwind CSS + Radix UI (following Stitch design system) |
| Storage | Supabase Storage |
| Deploy | Vercel (Production + Preview) |

---

## 3. Data Model

### 3.1 Core Entities

**User**
- `id`, `email`, `name`, `avatar`, `role` (CLIENT | DEVELOPER | ADMIN), `locale`, `emailVerified`, `createdAt`, `updatedAt`
- Single table, multi-role. One user can be both client and developer.

**DeveloperProfile** (1:1 with User)
- `userId`, `displayName`, `title`, `bio`
- Skills via `DeveloperSkill` junction table
- `githubUrl`, `portfolioUrl`, `hourlyRate`, `currency`, `aiRating`, `verifiedAt`, `status` (PENDING_REVIEW | APPROVED | REJECTED | SUSPENDED), `stripeConnectAccountId` (nullable, populated after Stripe Connect onboarding), `createdAt`

**Availability** (many per DeveloperProfile)
- `profileId`, `date`, `startTime`, `endTime`, `status` (AVAILABLE | BUSY | TENTATIVE | BLOCKED), `note`

**SkillTag**
- `id`, `name`, `category`, `locale_zh`, `locale_en`

**ProjectSkill** (junction: Project ↔ SkillTag, many-to-many)
- `projectId` (FK → Project.id), `skillTagId` (FK → SkillTag.id)

**DeveloperSkill** (junction: DeveloperProfile ↔ SkillTag, many-to-many)
- `profileId` (FK → DeveloperProfile.id), `skillTagId` (FK → SkillTag.id)

**Project**
- `id`, `clientId`, `title`, `description`, `budget`, `currency`, `category`, `aiSummary`, `status` (DRAFT | PUBLISHED | IN_PROGRESS | DELIVERED | COMPLETED | CANCELLED), `visibility`, `createdAt`, `updatedAt`
- Skills via `ProjectSkill` junction table

**Conversation** (independent of Project, can be linked later)
- `id`, `userId`, `projectId?`, `status` (DISCOVERY | CONFIRMATION | MATCHING | PUBLISHED | ABANDONED), `modelProvider`, `createdAt`, `updatedAt`

**Message**
- `id`, `conversationId`, `role` (USER | ASSISTANT | SYSTEM), `content`, `metadata` (JSON), `createdAt`

**Application**
- `id`, `projectId`, `developerId`, `coverLetter`, `proposedRate`, `status` (PENDING | SHORTLISTED | ACCEPTED | REJECTED | WITHDRAWN), `aiScore`, `createdAt`

**Contract**
- `id`, `projectId`, `clientId`, `developerId`, `title`, `terms` (JSON), `totalAmount`, `currency`, `status` (DRAFT | PENDING_SIGN | ACTIVE | DELIVERED | COMPLETED | DISPUTED | CANCELLED), `signedByClient`, `signedByDeveloper`, `signedAt`, `createdAt`

**Milestone** (reserved for Phase 2)
- `id`, `contractId`, `title`, `description`, `amount`, `dueDate`, `order`, `status`, `deliverables`

**Payment**
- `id`, `contractId`, `milestoneId?`, `amount`, `currency`, `provider` (STRIPE | ALIPAY | WECHAT_PAY), `providerPaymentId`, `providerEventId` (unique, for webhook idempotency), `status` (PENDING | PROCESSING | HELD | RELEASED | REFUNDED | FAILED), `paidAt`, `createdAt`

**Deliverable**
- `id`, `contractId`, `milestoneId?`, `title`, `fileUrl`, `description`, `uploadedBy` (FK → User.id, must be the developer on the contract), `status`, `reviewComment`, `createdAt`

**Notification**
- `id`, `userId`, `type`, `title`, `body`, `link`, `read`, `createdAt`

**ProcessedWebhookEvent** (idempotency log for all webhook handlers)
- `id`, `providerEventId` (unique), `provider` (STRIPE | STRIPE_CONNECT | ALIPAY | WECHAT_PAY), `processedAt`
- Used by all webhook handlers to deduplicate retried events

### 3.2 Key Design Decisions
- **Conversation independent of Project**: AI conversations happen before a project exists (pre-sales). The optional `projectId` links them after project creation.
- **Milestone table ready but unused in MVP**: Contract uses simple state machine; Milestone is pre-built for Phase 2 milestone-based payments.
- **Payment supports Escrow**: HELD status = funds in platform custody; RELEASED = transferred to developer after acceptance.
- **Contract terms as JSON**: Flexible storage for various contract clauses, rendered by frontend.

---

## 4. AI Engine & Matching System

### 4.1 AI Conversation Flow (4 Phases)

**Phase 1 — Discovery**: AI asks clarifying questions, extracts structured requirements via Tool Calling (not free-text parsing).

**Phase 2 — Confirmation**: AI generates a project summary card (type, skills, budget range, timeline). Client confirms or modifies.

**Phase 3 — Smart Match**: Matching engine scores developers → AI re-ranks top results and generates recommendation reasons → displays developer profile cards.

**Phase 4 — Publish**: AI auto-generates project listing content. Client confirms → Project status = PUBLISHED.

### 4.2 Multi-Model Gateway

Built on Vercel AI SDK with unified interface:
- Routes to model based on `conversation.modelProvider`
- Auto-fallback when primary model is unavailable
- Rate limiting via Upstash Redis

**Tool Definitions:**
- `extractRequirements()` → structured requirements
- `searchDevelopers()` → matching engine query
- `generateProjectDraft()` → project draft
- `estimateBudget()` → budget suggestion
- `checkAvailability()` → calendar query

**System Prompt Management:**
- Role: AI Project Consultant
- Phase-aware: dynamically adjusts based on conversation stage
- Language-adaptive: follows user's language
- Safety: never exposes internal logic

### 4.3 Matching Algorithm

**Inputs:**
- Skill match (project requirements ∩ developer skills)
- Availability (project timeline ∩ developer calendar)
- Budget fit (project budget vs developer hourly rate)
- AI rating (GitHub analysis + historical completion rate)
- Historical reviews (accumulated over time)
- Language preference (used as hard filter, not scored)

**Process:**
1. Hard filter: skill coverage ≥ 70%, must have available time slots, language must match client preference
2. Weighted scoring:
   ```
   score = skill_match × 0.35
         + availability × 0.25
         + budget_fit × 0.15
         + ai_rating × 0.15
         + history × 0.10
   ```
3. AI re-ranking: LLM re-ranks top 20 and generates recommendation reasons
4. Output: Top 5 with profile cards + match score + reasons

---

## 5. Routes & User Flows

### 5.1 Route Structure

```
app/
├── [locale]/                          # /en/... /zh/...
│   ├── page.tsx                       # Landing Page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify/page.tsx
│   ├── (public)/
│   │   ├── projects/page.tsx          # Project marketplace
│   │   ├── projects/[id]/page.tsx     # Project detail
│   │   ├── developers/page.tsx        # Developer cards
│   │   ├── developers/[id]/page.tsx   # Developer profile
│   │   └── how-it-works/page.tsx
│   ├── chat/
│   │   ├── page.tsx                   # New conversation
│   │   └── [conversationId]/page.tsx  # Conversation (Streaming)
│   ├── dashboard/
│   │   ├── client/
│   │   │   ├── page.tsx               # Overview
│   │   │   ├── projects/page.tsx      # My projects
│   │   │   ├── projects/new/page.tsx  # Post project manually
│   │   │   ├── projects/[id]/page.tsx # Project management
│   │   │   └── talent/page.tsx        # Talent management
│   │   └── developer/
│   │       ├── page.tsx               # Overview
│   │       ├── profile/page.tsx       # Edit profile
│   │       ├── calendar/page.tsx      # Availability calendar
│   │       ├── projects/page.tsx      # My contracts
│   │       ├── projects/[id]/page.tsx # Contract detail
│   │       └── earnings/page.tsx      # Earnings
│   └── settings/
│       ├── page.tsx                   # Account
│       ├── notifications/page.tsx
│       └── billing/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── chat/route.ts                  # AI Streaming
│   ├── webhooks/stripe/route.ts            # Stripe payment webhooks
│   ├── webhooks/stripe/connect/route.ts    # Stripe Connect account events
│   ├── webhooks/payment/route.ts           # Alipay/WeChat callbacks (Phase 2)
│   ├── admin/contracts/[id]/resolve/route.ts # Admin dispute resolution
│   ├── projects/route.ts
│   ├── developers/route.ts
│   ├── contracts/route.ts
│   ├── contracts/[id]/request-revision/route.ts  # Client requests revision
│   ├── upload/route.ts
│   └── cron/match-notify/route.ts
└── middleware.ts                       # Auth + i18n + RBAC
```

### 5.2 Client Journey
Landing → Register/Login → AI Chat (or manual post) → Requirement extraction → Smart match → Select developer → Application accepted → Auto-generate contract → Sign → Escrow payment → Developer delivers → Accept → Release payment → Complete

### 5.3 Developer Journey
Landing → Register → Create profile → AI auto-review → Stripe Connect onboarding (Express) → Set calendar availability → Receive invitations / Browse marketplace → Apply → Contract signed → Payment confirmed (Escrow) → Develop & deliver → Client accepts → Receive payment (via Stripe Connect transfer)

---

## 6. Transaction & Contract

### 6.1 Contract State Machine

```
DRAFT → PENDING_SIGN → ACTIVE → DELIVERED → COMPLETED
                          │          │
                          │          ├→ ACTIVE (revision request)
                          │          └→ DISPUTED (from DELIVERED)
                          │                 ↓
                          ├→ DISPUTED → Admin manual resolution → ACTIVE or CANCELLED
                          └→ CANCELLED (refund)

Note: DISPUTED can be entered from both ACTIVE and DELIVERED states.

> **DELIVERED → ACTIVE (Revision):** Client requests revision via `/api/contracts/[id]/request-revision`. Only the client (contract owner) can trigger this. The client must provide a `reviewComment` explaining what needs revision. Payment remains in HELD (Escrow) status during revision. The developer then re-delivers, transitioning the contract back to DELIVERED. No limit on revision cycles in MVP — abuse prevention is a Phase 2 concern.

> **MVP Note on DISPUTED**: There is no automated dispute resolution system in MVP. Disputes are resolved manually by admin via a force-resolve API endpoint (`/api/admin/contracts/[id]/resolve`). Funds in HELD status remain frozen until admin intervenes.
```

### 6.2 Escrow Payment Flow

1. Contract signed → Client selects payment method (Stripe for MVP)
2. PaymentService abstraction layer processes payment
3. Webhook confirms success → Payment status = HELD (Escrow)
4. Client accepts delivery → Payment status = RELEASED
5. Platform fee auto-deducted (configurable, 10-15%)
6. Developer receives: contract amount - platform fee

**Stripe Connect**: Developers register as Connected Accounts (Express) for direct transfers. After profile approval, developers are guided through Stripe Connect onboarding (redirect-based). The `stripeConnectAccountId` on DeveloperProfile is populated after successful onboarding. Webhook `/api/webhooks/stripe/connect` handles `account.updated` events.

### 6.3 Contract Auto-Generation
- System extracts data from Project + Application
- AI generates contract draft based on template + context
- Stored in Contract table, `terms` field as JSON
- Both parties preview online → can request modifications
- Both click "Sign" → status auto-transitions to ACTIVE
- MVP uses platform click-to-confirm (not legal-grade); DocuSign integration reserved for later

---

## 7. Security

### Authentication & Authorization
- NextAuth.js v5 with JWT sessions + CSRF protection
- Middleware RBAC: role-based route access control
- API routes verify session + role + resource ownership

### Data Security
- **Application-layer authorization**: Prisma queries always filter by authenticated user's ID and role. Prisma bypasses Supabase RLS (connects via direct connection string), so all access control is enforced at the service layer. Supabase RLS is configured as a secondary defense for direct Supabase client calls (e.g., Realtime subscriptions), but is NOT the primary security mechanism.
- Sensitive fields (payment tokens, API keys) encrypted with AES-256
- Prisma parameterized queries (zero SQL concatenation)
- CSP headers + React auto-escaping (XSS prevention)

### AI Security
- Prompt injection defense: system prompt isolation
- Rate limiting via Upstash Redis
- Output content filtering
- API keys in Vercel encrypted environment variables

### Payment Security
- Webhook signature verification (Stripe)
- Idempotent processing (prevent duplicate payments/releases)
- Server-side amount calculation (never trust client-sent amounts)
- PCI compliant (no card storage, Stripe Elements only)

---

## 8. Performance

### Rendering Strategy
| Page Type | Strategy |
|-----------|----------|
| Landing, public pages | SSG (Static Site Generation) |
| Project/developer lists | ISR (Incremental Static Regeneration, 60s) |
| Dashboard | SSR (Server-Side Rendering) |
| AI Chat | CSR (Client-Side Rendering, Streaming) |

### Caching
- Upstash Redis: hot project/developer list caching
- Next.js Data Cache: fetch-level caching + revalidate
- Edge Middleware: static asset CDN caching
- React Query: client-side state cache + optimistic updates

### Database Optimization
- Composite indexes on junction tables (ProjectSkill.skillTagId, DeveloperSkill.skillTagId), entity status, createdAt
- PostgreSQL tsvector for full-text search
- Supabase pgBouncer + Prisma connection pooling
- Cursor-based pagination for large lists

### Performance Targets
- Page load: < 2s
- AI first token: < 1s

---

## 9. MVP Scope

### Included in MVP
- Landing Page (bilingual zh/en)
- Email + Google + GitHub authentication
- AI conversation pre-sales (single model first, architecture supports multi-model)
- Project publishing (AI-assisted + manual)
- Developer profile creation + AI auto-review
- Developer card browsing + search/filter
- Smart matching recommendation (basic weighted algorithm)
- Availability calendar (basic day view)
- Application → Contract → Payment → Delivery full flow
- Stripe payment integration
- Client + Developer Dashboards
- Basic notification system (in-app + email)
- Vercel deployment

### Excluded from MVP (Phase 2+)
- Alipay / WeChat Pay
- Milestone-based payments
- Real-time chat (client ↔ developer direct messaging)
- Dispute arbitration system
- Rating / review system
- Developer withdrawal / wallet management
- Mobile responsive / App
- Advanced search (semantic search / vector matching)
- Team collaboration (multi-person project management)
- Admin analytics dashboard
- DocuSign legal-grade signatures
- Multi-timezone calendar sync
- SEO optimization (blog, developer showcase)

### MVP Success Criteria
1. **Functional closure**: Client can complete the full flow from AI conversation to payment and delivery
2. **Dual-role usability**: Both client and developer dashboards are fully functional
3. **AI core experience**: AI conversation accurately extracts requirements and recommends matching developers
4. **Payment closure**: Stripe payment → Escrow → Release works end-to-end
5. **Performance baseline**: Page load < 2s, AI first token < 1s

---

## 10. Design System Reference

The UI follows the Stitch design system "The Synthetic Architect":
- **Fonts**: Inter (body, headline, label)
- **Colors**: Midnight Blue primary (#0F172A), Electric Cyan secondary (#00E5FF), Neon Violet tertiary (#9D00FF)
- **Rules**: No 1px borders (use background shifts + tonal transitions), Glassmorphism for floating elements, Ghost borders at 20% opacity
- **Components**: Gradient primary buttons, no-divider cards, Electric Cyan for success/active/primary actions

Stitch project: `projects/501262254714746887` — 9 screens covering Landing Page, Find Experts, Developer Profile, Project Details, Post Project, AI Scoping Assistant, Developer Dashboard, Client Dashboard, Navigation Flow.
