# Plan 5: Landing Page, Notifications & Final MVP Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the MVP by building a compelling landing page, in-app notification system, and polishing remaining gaps — making the platform feel complete for the full client→AI→developer→contract→payment→delivery flow.

**Architecture:** Server Actions for notification CRUD. Server Components for landing page sections. Client component for notification dropdown in nav. i18n messages for all new UI text.

**Tech Stack:** Next.js 16, Server Components, Server Actions, next-intl, Tailwind v4, Prisma 7

**Spec reference:** `docs/superpowers/specs/2026-03-24-project-hall-ai-marketplace-design.md` — Sections 5, 9, 10

**Depends on:** Plans 1-4 (Foundation, Developer, Project & AI, Transaction) — completed

---

## File Structure

```
src/
├── app/
│   └── [locale]/
│       ├── page.tsx                              # Landing page (MODIFY — full redesign)
│       └── dashboard/
│           ├── client/
│           │   └── projects/
│           │       └── [id]/
│           │           └── page.tsx              # (MODIFY — add deliverable review)
│           └── developer/
│               └── page.tsx                      # (MODIFY — add recent activity)
├── components/
│   ├── landing/
│   │   ├── hero-section.tsx                      # Hero with gradient text + CTA
│   │   ├── features-section.tsx                  # 3-column feature cards
│   │   └── how-it-works-section.tsx              # Step-by-step flow
│   └── notification/
│       ├── notification-bell.tsx                 # Nav bell icon with badge
│       └── notification-dropdown.tsx             # Notification list dropdown
├── lib/
│   └── actions/
│       └── notification.ts                       # Notification CRUD
└── i18n/
    └── messages/
        ├── en.json                               # (MODIFY — add landing/notification keys)
        └── zh.json                               # (MODIFY — add landing/notification keys)
```

---

## Task 1: Notification Server Actions

**Files:**
- Create: `src/lib/actions/notification.ts`

- [ ] **Step 1: Create notification server actions**

Create `src/lib/actions/notification.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getMyNotifications(opts?: { unreadOnly?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const where: Record<string, unknown> = { userId: session.user.id };
  if (opts?.unreadOnly) where.read = false;

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return { data: 0 };

  const count = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return { data: count };
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  return { data: { success: true } };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return { data: { success: true } };
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add notification server actions"
```

---

## Task 2: Notification UI Components

**Files:**
- Create: `src/components/notification/notification-bell.tsx`
- Create: `src/components/notification/notification-dropdown.tsx`
- Modify: `src/components/nav.tsx` — add notification bell

- [ ] **Step 1: Create notification dropdown**

Create `src/components/notification/notification-dropdown.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyNotifications().then((result) => {
      if (result.data) setNotifications(result.data);
      setLoading(false);
    });
  }, []);

  async function handleRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface-container-low shadow-xl ghost-border z-50">
      <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
        <Button variant="tertiary" size="sm" onClick={handleMarkAll}>
          Mark all read
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">No notifications</p>
        ) : (
          notifications.map((n) => (
            <a
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => !n.read && handleRead(n.id)}
              className={`block border-b border-outline-variant/5 px-4 py-3 transition-colors hover:bg-surface-container ${
                !n.read ? "bg-accent-cyan/5" : ""
              }`}
            >
              <p className="text-sm font-medium text-on-surface">{n.title}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
              <p className="mt-1 text-xs text-on-surface-variant/60">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create notification bell**

Create `src/components/notification/notification-bell.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { getUnreadCount } from "@/lib/actions/notification";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount().then((result) => {
      if (result.data) setCount(result.data);
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-primary">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: Add NotificationBell to Nav**

Modify `src/components/nav.tsx` — import and add `<NotificationBell />` next to the user menu (only shown when logged in). Read the file first to understand the structure.

The bell should appear between the locale switcher and the user menu/login button, wrapped in a session check:

```tsx
import { NotificationBell } from "@/components/notification/notification-bell";

// In the nav JSX, next to user controls:
{session && <NotificationBell />}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add notification bell and dropdown in navigation"
```

---

## Task 3: Landing Page Redesign

**Files:**
- Create: `src/components/landing/hero-section.tsx`
- Create: `src/components/landing/features-section.tsx`
- Create: `src/components/landing/how-it-works-section.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/zh.json`

- [ ] **Step 1: Create hero section**

Create `src/components/landing/hero-section.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  t: (key: string) => string;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:py-40">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-tertiary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
          {t("heroTitle")}{" "}
          <span className="bg-gradient-to-r from-accent-cyan to-tertiary bg-clip-text text-transparent">
            {t("heroHighlight")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-r from-primary to-primary-container px-8 text-base font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            {t("ctaStart")}
          </Link>
          <Link
            href="/developers"
            className="inline-flex h-12 items-center justify-center rounded-md bg-surface-container-highest px-8 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            {t("ctaBrowse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create features section**

Create `src/components/landing/features-section.tsx`:

```tsx
interface FeaturesSectionProps {
  t: (key: string) => string;
}

const features = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    titleKey: "featureAiTitle",
    descKey: "featureAiDesc",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    titleKey: "featureMatchTitle",
    descKey: "featureMatchDesc",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    titleKey: "featureSecureTitle",
    descKey: "featureSecureDesc",
  },
];

export function FeaturesSection({ t }: FeaturesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold text-on-surface sm:text-3xl">
        {t("featuresTitle")}
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.titleKey}
            className="rounded-xl bg-surface-container-low p-6 ghost-border"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
              {feature.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-on-surface">
              {t(feature.titleKey)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {t(feature.descKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create how-it-works section**

Create `src/components/landing/how-it-works-section.tsx`:

```tsx
interface HowItWorksSectionProps {
  t: (key: string) => string;
}

const steps = [
  { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
  { num: "04", titleKey: "step4Title", descKey: "step4Desc" },
];

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold text-on-surface sm:text-3xl">
        {t("howTitle")}
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.num} className="relative rounded-xl bg-surface-container-low p-6 ghost-border">
            <span className="text-3xl font-bold text-accent-cyan/20">{step.num}</span>
            <h3 className="mt-2 text-base font-semibold text-on-surface">
              {t(step.titleKey)}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t(step.descKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update i18n messages**

Add new keys to `src/i18n/messages/en.json` landing section:

```json
"landing": {
  "heroTitle": "The AI-Powered Way to Hire",
  "heroHighlight": "AI Talent",
  "heroSubtitle": "Tell our AI what you need. We'll match you with vetted developers, handle contracts, and manage payments — all automatically.",
  "ctaStart": "Start a Conversation",
  "ctaBrowse": "Browse Developers",
  "featuresTitle": "Why Choose ChuDaGang AI",
  "featureAiTitle": "AI-Powered Matching",
  "featureAiDesc": "Our AI understands your project requirements and matches you with the most suitable developers based on skills, experience, and availability.",
  "featureMatchTitle": "Vetted Developers",
  "featureMatchDesc": "Every developer is AI-reviewed and verified. Browse profiles, ratings, and portfolios to find the perfect match for your project.",
  "featureSecureTitle": "Secure Payments",
  "featureSecureDesc": "Escrow-protected payments via Stripe. Funds are held safely until you approve the delivery. No risk, no hassle.",
  "howTitle": "How It Works",
  "step1Title": "Describe Your Project",
  "step1Desc": "Chat with our AI assistant or post manually. The AI helps you clarify requirements and estimate budgets.",
  "step2Title": "Get Matched",
  "step2Desc": "Our matching engine finds the best developers for your project based on skills, rates, and availability.",
  "step3Title": "Sign & Pay",
  "step3Desc": "AI generates a contract. Both parties sign online. Payment is held in secure escrow via Stripe.",
  "step4Title": "Receive & Review",
  "step4Desc": "Developer delivers the work. Review, request revisions, or accept. Payment is released automatically on approval."
}
```

Add corresponding Chinese translations to `src/i18n/messages/zh.json`.

- [ ] **Step 5: Rewrite landing page**

Modify `src/app/[locale]/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <>
      <Nav />
      <main>
        <HeroSection t={(key) => t(key)} />
        <FeaturesSection t={(key) => t(key)} />
        <HowItWorksSection t={(key) => t(key)} />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: redesign landing page with hero, features, and how-it-works sections"
```

---

## Task 4: Deliverable Review in Client Dashboard + Developer Dashboard Activity

**Files:**
- Modify: `src/app/[locale]/dashboard/client/projects/[id]/page.tsx` — add accept/reject buttons for deliverables
- Modify: `src/app/[locale]/dashboard/developer/page.tsx` — add recent contracts and notifications

- [ ] **Step 1: Add deliverable review actions to client project detail**

In the client project detail page, for each deliverable with status "SUBMITTED", add Accept and Reject buttons that call `reviewDeliverable` from `@/lib/actions/delivery`. Since this needs interactivity, create a small client component:

Create `src/components/delivery/deliverable-review.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { reviewDeliverable } from "@/lib/actions/delivery";

interface Props {
  deliverableId: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  status: string;
}

export function DeliverableReview({ deliverableId, title, description, fileUrl, status }: Props) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleReview(action: "ACCEPTED" | "REJECTED") {
    setLoading(true);
    const comment = action === "REJECTED" ? prompt("Reason for rejection:") : undefined;
    await reviewDeliverable({
      deliverableId,
      status: action,
      reviewComment: comment ?? undefined,
    });
    setCurrentStatus(action);
    setLoading(false);
  }

  return (
    <div className="rounded-lg bg-surface-container-lowest p-3 ghost-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-on-surface text-sm">{title}</p>
          {description && <p className="mt-1 text-xs text-on-surface-variant">{description}</p>}
        </div>
        <span className="text-xs text-accent-cyan">{currentStatus}</span>
      </div>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent-cyan underline">
          View file
        </a>
      )}
      {currentStatus === "SUBMITTED" && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => handleReview("ACCEPTED")} disabled={loading}>Accept</Button>
          <Button size="sm" variant="destructive" onClick={() => handleReview("REJECTED")} disabled={loading}>Reject</Button>
        </div>
      )}
    </div>
  );
}
```

Then modify the client project detail page to use `DeliverableReview` instead of the static deliverable display.

- [ ] **Step 2: Add activity to developer dashboard overview**

Read and modify `src/app/[locale]/dashboard/developer/page.tsx`. Add recent contracts and recent notifications to give the developer an at-a-glance overview. Query the 5 most recent contracts and 5 most recent notifications.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add deliverable review actions and developer dashboard activity"
```

---

## Task 5: Final Build Verification & Push

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Fix any type errors.

- [ ] **Step 2: Commit any final fixes**

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

---

## Summary

After completing this plan, the MVP is feature-complete:
- **Landing page** — hero with gradient text, 3-column feature cards, 4-step how-it-works
- **Notification system** — server actions (CRUD), bell icon with unread badge, dropdown list
- **Deliverable review** — client can accept/reject deliverables with inline buttons
- **Developer dashboard** — overview with recent activity
- **Bilingual i18n** — all new text in both zh and en
- **28+ routes** all building cleanly

MVP Success Criteria coverage:
1. Functional closure: Full flow AI→Project→Application→Contract→Payment→Delivery
2. Dual-role usability: Client and Developer dashboards fully functional
3. AI core experience: Streaming chat with tool calling and smart matching
4. Payment closure: Stripe Checkout→Escrow→Release with Stripe Connect payouts
5. Performance baseline: SSR/RSC architecture, Turbopack builds
