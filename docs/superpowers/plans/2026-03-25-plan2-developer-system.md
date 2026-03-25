# Plan 2: Developer System — Profile, AI Review & Calendar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the developer-side experience: profile creation/editing, AI auto-review on registration, availability calendar, and public developer card browsing with search/filter.

**Architecture:** Server Actions for form mutations, React Query for client-side data fetching, Vercel AI SDK for GitHub profile analysis. Developer profiles are public (browsable) once approved.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 7, Vercel AI SDK, React Query (TanStack Query), next-intl

**Spec reference:** `docs/superpowers/specs/2026-03-24-project-hall-ai-marketplace-design.md`

**Depends on:** Plan 1 (Foundation) — completed

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/
│   │   │   └── developers/
│   │   │       ├── page.tsx                    # Developer listing (search/filter)
│   │   │       └── [id]/page.tsx               # Public developer profile
│   │   └── dashboard/
│   │       └── developer/
│   │           ├── layout.tsx                  # Developer dashboard layout (sidebar)
│   │           ├── page.tsx                    # Developer overview
│   │           ├── profile/page.tsx            # Edit profile
│   │           └── calendar/page.tsx           # Availability calendar
│   ├── api/
│   │   └── developers/
│   │       ├── route.ts                        # GET: search/filter developers
│   │       └── [id]/route.ts                   # GET: single developer profile
├── lib/
│   ├── actions/
│   │   ├── profile.ts                          # Server Actions: create/update profile
│   │   └── availability.ts                     # Server Actions: manage availability
│   ├── services/
│   │   ├── developer-review.ts                 # AI auto-review service
│   │   └── matching.ts                         # Developer search/filter queries
│   └── validators/
│       └── profile.ts                          # Zod schemas for profile validation
├── components/
│   ├── developer/
│   │   ├── profile-form.tsx                    # Profile edit form
│   │   ├── developer-card.tsx                  # Developer card (for listing)
│   │   ├── developer-profile-view.tsx          # Full profile view
│   │   ├── skill-selector.tsx                  # Multi-select skill tags
│   │   ├── availability-calendar.tsx           # Calendar component
│   │   └── availability-slot-editor.tsx        # Time slot editor
│   └── dashboard/
│       ├── developer-sidebar.tsx               # Dashboard sidebar nav
│       └── stats-card.tsx                      # Stats display card
└── types/
    └── developer.ts                            # Developer-specific types
```

---

## Task 1: Zod Validators & Developer Types

**Files:**
- Create: `src/lib/validators/profile.ts`
- Create: `src/types/developer.ts`

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Create developer types**

Create `src/types/developer.ts`:

```typescript
import type { DeveloperProfile, SkillTag, Availability, User } from "@prisma/client";

export type DeveloperWithSkills = DeveloperProfile & {
  user: Pick<User, "id" | "name" | "email" | "avatar">;
  skills: { skillTag: SkillTag }[];
  availabilities?: Availability[];
};

export type DeveloperCardData = {
  id: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  currency: string;
  aiRating: number | null;
  status: string;
  avatar: string | null;
  skills: { id: string; name: string; localeZh: string; localeEn: string }[];
};

export type DeveloperSearchParams = {
  query?: string;
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  available?: boolean;
  page?: number;
  limit?: number;
};
```

- [ ] **Step 3: Create Zod validators**

Create `src/lib/validators/profile.ts`:

```typescript
import { z } from "zod";

export const profileCreateSchema = z.object({
  displayName: z.string().min(2).max(100),
  title: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).max(1000).optional(),
  currency: z.enum(["USD", "CNY", "EUR"]).default("USD"),
  skillTagIds: z.array(z.string()).min(1, "Select at least one skill"),
});

export const profileUpdateSchema = profileCreateSchema.partial();

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["AVAILABLE", "BUSY", "TENTATIVE", "BLOCKED"]).default("AVAILABLE"),
  note: z.string().max(500).optional(),
});

export const availabilityBatchSchema = z.object({
  slots: z.array(availabilitySchema).min(1),
});

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add developer types and Zod validators"
```

---

## Task 2: Server Actions — Profile CRUD

**Files:**
- Create: `src/lib/actions/profile.ts`

- [ ] **Step 1: Create profile server actions**

Create `src/lib/actions/profile.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileCreateSchema, profileUpdateSchema } from "@/lib/validators/profile";
import { revalidatePath } from "next/cache";

export async function createProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const raw = {
    displayName: formData.get("displayName"),
    title: formData.get("title"),
    bio: formData.get("bio"),
    githubUrl: formData.get("githubUrl"),
    portfolioUrl: formData.get("portfolioUrl"),
    hourlyRate: formData.get("hourlyRate"),
    currency: formData.get("currency"),
    skillTagIds: formData.getAll("skillTagIds"),
  };

  const parsed = profileCreateSchema.parse(raw);
  const { skillTagIds, ...profileData } = parsed;

  const profile = await db.developerProfile.create({
    data: {
      ...profileData,
      hourlyRate: profileData.hourlyRate ?? null,
      userId: session.user.id,
      status: "PENDING_REVIEW",
      skills: {
        create: skillTagIds.map((id) => ({ skillTagId: id })),
      },
    },
  });

  // Update user role to DEVELOPER
  await db.user.update({
    where: { id: session.user.id },
    data: { role: "DEVELOPER" },
  });

  revalidatePath("/dashboard/developer/profile");
  return { success: true, profileId: profile.id };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  const raw = {
    displayName: formData.get("displayName") || undefined,
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    githubUrl: formData.get("githubUrl") || undefined,
    portfolioUrl: formData.get("portfolioUrl") || undefined,
    hourlyRate: formData.get("hourlyRate") || undefined,
    currency: formData.get("currency") || undefined,
    skillTagIds: formData.getAll("skillTagIds"),
  };

  const parsed = profileUpdateSchema.parse(raw);
  const { skillTagIds, ...profileData } = parsed;

  await db.$transaction(async (tx) => {
    await tx.developerProfile.update({
      where: { id: profile.id },
      data: {
        ...profileData,
        hourlyRate: profileData.hourlyRate ?? undefined,
      },
    });

    if (skillTagIds && skillTagIds.length > 0) {
      await tx.developerSkill.deleteMany({ where: { profileId: profile.id } });
      await tx.developerSkill.createMany({
        data: skillTagIds.map((id) => ({ profileId: profile.id, skillTagId: id })),
      });
    }
  });

  revalidatePath("/dashboard/developer/profile");
  return { success: true };
}

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.developerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      skills: { include: { skillTag: true } },
      availabilities: { where: { date: { gte: new Date() } }, orderBy: { date: "asc" } },
    },
  });
}

export async function getSkillTags() {
  return db.skillTag.findMany({ orderBy: { category: "asc" } });
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add profile server actions (create, update, getMyProfile)"
```

---

## Task 3: Server Actions — Availability Calendar

**Files:**
- Create: `src/lib/actions/availability.ts`

- [ ] **Step 1: Create availability server actions**

Create `src/lib/actions/availability.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { availabilityBatchSchema } from "@/lib/validators/profile";
import { revalidatePath } from "next/cache";

export async function setAvailability(formData: {
  slots: { date: string; startTime: string; endTime: string; status?: string; note?: string }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  const parsed = availabilityBatchSchema.parse(formData);

  await db.$transaction(async (tx) => {
    // Delete existing slots for the dates being set
    const dates = [...new Set(parsed.slots.map((s) => s.date))];
    for (const date of dates) {
      await tx.availability.deleteMany({
        where: { profileId: profile.id, date: new Date(date) },
      });
    }

    // Create new slots
    await tx.availability.createMany({
      data: parsed.slots.map((slot) => ({
        profileId: profile.id,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: (slot.status as "AVAILABLE" | "BUSY" | "TENTATIVE" | "BLOCKED") ?? "AVAILABLE",
        note: slot.note,
      })),
    });
  });

  revalidatePath("/dashboard/developer/calendar");
  return { success: true };
}

export async function getMyAvailability(month: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return [];

  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  return db.availability.findMany({
    where: {
      profileId: profile.id,
      date: { gte: startDate, lt: endDate },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function deleteAvailabilitySlot(slotId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found");

  await db.availability.deleteMany({
    where: { id: slotId, profileId: profile.id },
  });

  revalidatePath("/dashboard/developer/calendar");
  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add availability server actions (set, get, delete)"
```

---

## Task 4: AI Auto-Review Service

**Files:**
- Create: `src/lib/services/developer-review.ts`

- [ ] **Step 1: Install Vercel AI SDK**

```bash
npm install ai @ai-sdk/openai
```

Note: We install `@ai-sdk/openai` as the default provider. In production, the multi-model gateway will be configured. For MVP, any single provider works.

- [ ] **Step 2: Create AI review service**

Create `src/lib/services/developer-review.ts`:

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "@/lib/db";

const reviewResultSchema = z.object({
  rating: z.number().min(0).max(5).describe("Overall rating 0-5 based on skills, experience, and portfolio"),
  approved: z.boolean().describe("Whether the developer meets minimum quality bar"),
  reasoning: z.string().describe("Brief explanation of the rating"),
  suggestions: z.array(z.string()).describe("Suggestions for profile improvement"),
});

export async function reviewDeveloperProfile(profileId: string) {
  const profile = await db.developerProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { name: true, email: true } },
      skills: { include: { skillTag: true } },
    },
  });

  if (!profile) throw new Error("Profile not found");

  const skillNames = profile.skills.map((s) => s.skillTag.name).join(", ");

  const { object: review } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: reviewResultSchema,
    prompt: `You are an AI developer marketplace quality reviewer. Review this developer profile and provide a rating.

Developer: ${profile.displayName}
Title: ${profile.title || "Not provided"}
Bio: ${profile.bio || "Not provided"}
Skills: ${skillNames}
GitHub: ${profile.githubUrl || "Not provided"}
Portfolio: ${profile.portfolioUrl || "Not provided"}
Hourly Rate: ${profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Not set"}

Rate this developer 0-5 based on:
- Profile completeness (name, title, bio, skills)
- Skill relevance to AI/ML marketplace
- Presence of GitHub/portfolio links
- Professional presentation

Approve if rating >= 2.5. Be fair but maintain quality standards.`,
  });

  // Update profile with review results
  await db.developerProfile.update({
    where: { id: profileId },
    data: {
      aiRating: review.rating,
      status: review.approved ? "APPROVED" : "REJECTED",
      verifiedAt: review.approved ? new Date() : null,
    },
  });

  return review;
}
```

- [ ] **Step 3: Trigger review after profile creation**

Update `src/lib/actions/profile.ts` — add a call to trigger AI review after profile creation:

Add at the end of `createProfile()`, after the `revalidatePath` call:

```typescript
// Trigger AI review in background (don't block the response)
reviewDeveloperProfile(profile.id).catch(console.error);
```

Import at the top:
```typescript
import { reviewDeveloperProfile } from "@/lib/services/developer-review";
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add AI auto-review service for developer profiles"
```

---

## Task 5: Developer Search API

**Files:**
- Create: `src/lib/services/matching.ts`
- Create: `src/app/api/developers/route.ts`
- Create: `src/app/api/developers/[id]/route.ts`

- [ ] **Step 1: Create developer search service**

Create `src/lib/services/matching.ts`:

```typescript
import { db } from "@/lib/db";
import type { DeveloperSearchParams, DeveloperCardData } from "@/types/developer";

export async function searchDevelopers(params: DeveloperSearchParams): Promise<{
  developers: DeveloperCardData[];
  total: number;
}> {
  const { query, skills, minRate, maxRate, available, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (query) {
    where.OR = [
      { displayName: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { bio: { contains: query, mode: "insensitive" } },
    ];
  }

  if (minRate !== undefined || maxRate !== undefined) {
    where.hourlyRate = {};
    if (minRate !== undefined) (where.hourlyRate as Record<string, number>).gte = minRate;
    if (maxRate !== undefined) (where.hourlyRate as Record<string, number>).lte = maxRate;
  }

  if (skills && skills.length > 0) {
    where.skills = {
      some: { skillTag: { name: { in: skills } } },
    };
  }

  const [developers, total] = await Promise.all([
    db.developerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        skills: { include: { skillTag: true } },
      },
      orderBy: [{ aiRating: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.developerProfile.count({ where }),
  ]);

  return {
    developers: developers.map((d) => ({
      id: d.id,
      displayName: d.displayName,
      title: d.title,
      bio: d.bio,
      hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : null,
      currency: d.currency,
      aiRating: d.aiRating ? Number(d.aiRating) : null,
      status: d.status,
      avatar: d.user.avatar,
      skills: d.skills.map((s) => ({
        id: s.skillTag.id,
        name: s.skillTag.name,
        localeZh: s.skillTag.localeZh,
        localeEn: s.skillTag.localeEn,
      })),
    })),
    total,
  };
}
```

- [ ] **Step 2: Create API routes**

Create `src/app/api/developers/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchDevelopers } from "@/lib/services/matching";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const result = await searchDevelopers({
    query: searchParams.get("query") || undefined,
    skills: searchParams.get("skills")?.split(",").filter(Boolean) || undefined,
    minRate: searchParams.get("minRate") ? Number(searchParams.get("minRate")) : undefined,
    maxRate: searchParams.get("maxRate") ? Number(searchParams.get("maxRate")) : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
  });

  return NextResponse.json(result);
}
```

Create `src/app/api/developers/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await db.developerProfile.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, avatar: true, createdAt: true } },
      skills: { include: { skillTag: true } },
      availabilities: {
        where: { date: { gte: new Date() }, status: "AVAILABLE" },
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add developer search service and API routes"
```

---

## Task 6: UI Components — Developer Card & Skill Selector

**Files:**
- Create: `src/components/developer/developer-card.tsx`
- Create: `src/components/developer/skill-selector.tsx`
- Create: `src/components/developer/profile-form.tsx`

- [ ] **Step 1: Create DeveloperCard component**

Create `src/components/developer/developer-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { useLocale } from "next-intl";
import Link from "next/link";
import type { DeveloperCardData } from "@/types/developer";

interface DeveloperCardProps {
  developer: DeveloperCardData;
}

export function DeveloperCard({ developer }: DeveloperCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/developers/${developer.id}`}>
      <Card className="hover:bg-surface-container-low transition-colors cursor-pointer h-full">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-lg font-semibold">
            {developer.displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-on-surface truncate">{developer.displayName}</h3>
            {developer.title && (
              <p className="text-sm text-on-surface-variant truncate">{developer.title}</p>
            )}
          </div>
          {developer.aiRating && (
            <div className="flex items-center gap-1 text-sm text-accent-cyan font-medium">
              <span>{developer.aiRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {developer.bio && (
          <p className="mt-3 text-sm text-on-surface-variant line-clamp-2">{developer.bio}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {developer.skills.slice(0, 5).map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant"
            >
              {locale === "zh" ? skill.localeZh : skill.localeEn}
            </span>
          ))}
          {developer.skills.length > 5 && (
            <span className="text-xs text-on-surface-variant">+{developer.skills.length - 5}</span>
          )}
        </div>

        {developer.hourlyRate && (
          <div className="mt-3 text-sm font-medium text-on-surface">
            {developer.currency === "CNY" ? "¥" : "$"}{developer.hourlyRate}/hr
          </div>
        )}
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create SkillSelector component**

Create `src/components/developer/skill-selector.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

interface SkillTag {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
}

interface SkillSelectorProps {
  skills: SkillTag[];
  selected: string[];
  onChange: (ids: string[]) => void;
  name?: string;
}

export function SkillSelector({ skills, selected, onChange, name = "skillTagIds" }: SkillSelectorProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const grouped = skills.reduce<Record<string, SkillTag[]>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const filtered = search
    ? skills.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.localeZh.includes(search) ||
        s.localeEn.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const displaySkills = filtered
    ? { Results: filtered }
    : grouped;

  return (
    <div>
      <input
        type="text"
        placeholder={locale === "zh" ? "搜索技能..." : "Search skills..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-3 rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
      />

      <div className="max-h-60 overflow-y-auto space-y-4">
        {Object.entries(displaySkills).map(([category, categorySkills]) => (
          <div key={category}>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
              {category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categorySkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggle(skill.id)}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs transition-colors ${
                    selected.includes(skill.id)
                      ? "bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {locale === "zh" ? skill.localeZh : skill.localeEn}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden inputs for form submission */}
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create ProfileForm component**

Create `src/components/developer/profile-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkillSelector } from "./skill-selector";
import { createProfile, updateProfile } from "@/lib/actions/profile";

interface SkillTag {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
}

interface ProfileFormProps {
  skillTags: SkillTag[];
  initialData?: {
    displayName: string;
    title: string | null;
    bio: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    hourlyRate: number | null;
    currency: string;
    skills: { skillTag: { id: string } }[];
  };
  mode: "create" | "edit";
}

export function ProfileForm({ skillTags, initialData, mode }: ProfileFormProps) {
  const tc = useTranslations("common");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills.map((s) => s.skillTag.id) || []
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (mode === "create") {
        await createProfile(formData);
      } else {
        await updateProfile(formData);
      }
    } catch (error) {
      console.error("Profile save error:", error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Profile" : "Edit Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">Display Name *</label>
            <Input name="displayName" defaultValue={initialData?.displayName || ""} required className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Title</label>
            <Input name="title" defaultValue={initialData?.title || ""} placeholder="e.g. Senior AI Engineer" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Bio</label>
            <textarea
              name="bio"
              defaultValue={initialData?.bio || ""}
              rows={4}
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-on-surface">GitHub URL</label>
              <Input name="githubUrl" defaultValue={initialData?.githubUrl || ""} placeholder="https://github.com/..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface">Portfolio URL</label>
              <Input name="portfolioUrl" defaultValue={initialData?.portfolioUrl || ""} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-on-surface">Hourly Rate</label>
              <Input name="hourlyRate" type="number" defaultValue={initialData?.hourlyRate || ""} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface">Currency</label>
              <select
                name="currency"
                defaultValue={initialData?.currency || "USD"}
                className="mt-1 h-10 w-full rounded-md bg-surface-container-lowest px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              >
                <option value="USD">USD ($)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Skills *</label>
            <div className="mt-1">
              <SkillSelector skills={skillTags} selected={selectedSkills} onChange={setSelectedSkills} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tc("loading") : tc("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add developer UI components (card, skill selector, profile form)"
```

---

## Task 7: Dashboard & Pages

**Files:**
- Create: `src/components/dashboard/developer-sidebar.tsx`
- Create: `src/components/dashboard/stats-card.tsx`
- Create: `src/app/[locale]/dashboard/developer/layout.tsx`
- Create: `src/app/[locale]/dashboard/developer/page.tsx`
- Create: `src/app/[locale]/dashboard/developer/profile/page.tsx`
- Create: `src/app/[locale]/dashboard/developer/calendar/page.tsx`
- Create: `src/app/[locale]/(public)/developers/page.tsx`
- Create: `src/app/[locale]/(public)/developers/[id]/page.tsx`
- Create: `src/components/developer/availability-calendar.tsx`

This is a large task. Create all the pages and dashboard components.

- [ ] **Step 1: Create developer sidebar**

Create `src/components/dashboard/developer-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function DeveloperSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("common");

  const links = [
    { href: `/${locale}/dashboard/developer`, label: "Overview", icon: "📊" },
    { href: `/${locale}/dashboard/developer/profile`, label: "Profile", icon: "👤" },
    { href: `/${locale}/dashboard/developer/calendar`, label: "Calendar", icon: "📅" },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-outline-variant/10 bg-surface-container-low p-4">
      <h2 className="mb-4 px-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
        {t("dashboard")}
      </h2>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-surface-container-highest text-on-surface font-medium"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create stats card**

Create `src/components/dashboard/stats-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card>
      <p className="text-sm text-on-surface-variant">{title}</p>
      <p className="mt-1 text-2xl font-bold text-on-surface">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>}
    </Card>
  );
}
```

- [ ] **Step 3: Create developer dashboard layout**

Create `src/app/[locale]/dashboard/developer/layout.tsx`:

```tsx
import { DeveloperSidebar } from "@/components/dashboard/developer-sidebar";
import { Nav } from "@/components/nav";

export default function DeveloperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex flex-1">
        <DeveloperSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create developer overview page**

Create `src/app/[locale]/dashboard/developer/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function DeveloperDashboardPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const profile = await getMyProfile();

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Developer Dashboard</h1>

      {!profile ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <h2 className="text-lg font-semibold text-on-surface">Create Your Profile</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Set up your developer profile to start receiving project matches.
          </p>
          <a
            href="./developer/profile"
            className="mt-4 inline-block rounded-md bg-gradient-to-r from-primary to-primary-container px-4 py-2 text-sm text-on-primary"
          >
            Create Profile
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatsCard title="Profile Status" value={profile.status} />
          <StatsCard title="AI Rating" value={profile.aiRating ? Number(profile.aiRating).toFixed(1) : "Pending"} />
          <StatsCard title="Skills" value={profile.skills.length} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create profile edit page**

Create `src/app/[locale]/dashboard/developer/profile/page.tsx`:

```tsx
import { getMyProfile, getSkillTags } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/developer/profile-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const [profile, skillTags] = await Promise.all([getMyProfile(), getSkillTags()]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-on-surface mb-6">
        {profile ? "Edit Profile" : "Create Profile"}
      </h1>
      <ProfileForm
        skillTags={skillTags}
        initialData={profile ? {
          displayName: profile.displayName,
          title: profile.title,
          bio: profile.bio,
          githubUrl: profile.githubUrl,
          portfolioUrl: profile.portfolioUrl,
          hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
          currency: profile.currency,
          skills: profile.skills,
        } : undefined}
        mode={profile ? "edit" : "create"}
      />
    </div>
  );
}
```

- [ ] **Step 6: Create calendar page (basic)**

Create `src/app/[locale]/dashboard/developer/calendar/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Availability Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-on-surface-variant">
            Calendar component will be enhanced in future iterations. Use the API to set availability slots.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Create public developer listing page**

Create `src/app/[locale]/(public)/developers/page.tsx`:

```tsx
import { searchDevelopers } from "@/lib/services/matching";
import { DeveloperCard } from "@/components/developer/developer-card";

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await searchDevelopers({
    query: typeof params.query === "string" ? params.query : undefined,
    skills: typeof params.skills === "string" ? params.skills.split(",") : undefined,
    page: typeof params.page === "string" ? Number(params.page) : 1,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Find AI Experts</h1>

      {result.developers.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">No developers found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.developers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} />
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-on-surface-variant">
        {result.total} developer{result.total !== 1 ? "s" : ""} found
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create public developer profile page**

Create `src/app/[locale]/(public)/developers/[id]/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const profile = await db.developerProfile.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      user: { select: { name: true, avatar: true, createdAt: true } },
      skills: { include: { skillTag: true } },
      availabilities: {
        where: { date: { gte: new Date() }, status: "AVAILABLE" },
        orderBy: { date: "asc" },
        take: 14,
      },
    },
  });

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Card>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-3xl font-bold">
              {profile.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-on-surface">{profile.displayName}</h1>
              {profile.title && <p className="text-lg text-on-surface-variant">{profile.title}</p>}
              <div className="mt-2 flex items-center gap-4 text-sm text-on-surface-variant">
                {profile.aiRating && (
                  <span className="text-accent-cyan font-medium">Rating: {Number(profile.aiRating).toFixed(1)}/5</span>
                )}
                {profile.hourlyRate && (
                  <span>{profile.currency === "CNY" ? "¥" : "$"}{Number(profile.hourlyRate)}/hr</span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">About</h2>
              <p className="text-sm text-on-surface whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s.skillTag.id}
                  className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant"
                >
                  {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent-cyan hover:underline">GitHub</a>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent-cyan hover:underline">Portfolio</a>
            )}
          </div>

          {profile.availabilities.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Upcoming Availability</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {profile.availabilities.map((slot) => (
                  <div key={slot.id} className="rounded-lg bg-surface-container-low p-2 text-xs text-on-surface-variant">
                    <div className="font-medium">{new Date(slot.date).toLocaleDateString()}</div>
                    <div>{slot.startTime} - {slot.endTime}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 9: Run tests and verify**

```bash
npx vitest run
npm run lint
npm run build
```

- [ ] **Step 10: Commit and push**

```bash
git add .
git commit -m "feat: add developer dashboard, pages, and public listing"
git push origin main
```

---

## Summary

After completing this plan, you will have:
- Developer profile CRUD (create with role selection, edit)
- AI auto-review on profile creation (via Vercel AI SDK)
- Availability calendar management (server actions)
- Developer search API with skill/rate/availability filtering
- Public developer listing page with cards
- Public developer detail page with skills, bio, availability
- Developer dashboard with sidebar (Overview, Profile, Calendar)
- Zod validation for all inputs
- Ready for Plan 3 (Project & AI)
