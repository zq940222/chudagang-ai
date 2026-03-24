# Plan 1: Foundation — Project Scaffolding, Database & Authentication

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a working Next.js application with database schema, authentication (email + Google + GitHub), and basic layout — the foundation all other plans build on.

**Architecture:** Full Next.js 16 App Router monolith with Prisma ORM connecting to Supabase PostgreSQL. NextAuth.js v5 handles authentication with JWT sessions. Tailwind CSS + Radix UI for styling following the Stitch "Synthetic Architect" design system. next-intl for i18n scaffolding (zh/en).

**Tech Stack:** Next.js 16 (App Router), TypeScript (strict), Prisma, Supabase PostgreSQL, NextAuth.js v5, Tailwind CSS, Radix UI, next-intl, Upstash Redis

**Spec reference:** `docs/superpowers/specs/2026-03-24-project-hall-ai-marketplace-design.md`

---

## File Structure

```
chudagang-ai/
├── .env.local                          # Environment variables (git-ignored)
├── .env.example                        # Template for env vars
├── .gitignore
├── next.config.ts                      # Next.js config with i18n
├── tailwind.config.ts                  # Tailwind with design system tokens
├── tsconfig.json
├── package.json
├── prisma/
│   ├── schema.prisma                   # Complete data model
│   └── seed.ts                         # Seed data (skill tags, test users)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              # Root layout (providers, nav, footer)
│   │   │   ├── page.tsx                # Landing page (placeholder)
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx          # Auth layout (no nav)
│   │   │   │   ├── login/page.tsx      # Login page
│   │   │   │   └── register/page.tsx   # Register page (role selection)
│   │   │   └── (public)/
│   │   │       └── layout.tsx          # Public layout (with nav)
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │       └── register/route.ts        # Registration endpoint
│   │   └── globals.css                 # Global styles + design tokens
│   ├── auth.ts                         # NextAuth.js v5 config
│   ├── auth.config.ts                  # Auth providers config (edge-compatible)
│   ├── middleware.ts                    # Auth guard + i18n locale detection
│   ├── lib/
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── redis.ts                    # Upstash Redis client
│   │   └── utils.ts                    # cn() helper, shared utilities
│   ├── components/
│   │   ├── ui/                         # Base UI primitives (Radix wrappers)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   ├── nav.tsx                     # Main navigation
│   │   ├── footer.tsx                  # Footer
│   │   ├── locale-switcher.tsx         # Language toggle (zh/en)
│   │   └── user-menu.tsx               # Auth user dropdown
│   ├── i18n/
│   │   ├── navigation.ts              # next-intl navigation helpers (Link, useRouter, usePathname)
│   │   ├── request.ts                  # next-intl server config
│   │   ├── routing.ts                  # Locale routing config
│   │   └── messages/
│   │       ├── en.json                 # English translations
│   │       └── zh.json                 # Chinese translations
│   └── types/
│       └── index.ts                    # Shared TypeScript types
└── tests/
    ├── setup.ts                        # Test setup (Vitest)
    ├── lib/
    │   └── db.test.ts                  # DB connection test
    └── auth/
        └── auth.test.ts                # Auth flow tests
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.gitignore`, `.env.example`, `.env.local`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /d/MyProjectCode/chudagang-ai
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: Yes to all defaults. This creates the base Next.js project with App Router, TypeScript, Tailwind, ESLint.

- [ ] **Step 2: Install core dependencies**

```bash
npm install @prisma/client @auth/prisma-adapter next-auth@beta @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-avatar @radix-ui/react-slot class-variance-authority clsx tailwind-merge next-intl @upstash/redis bcryptjs
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node @types/bcryptjs tsx
```

- [ ] **Step 4: Create .env.example**

```bash
# .env.example
```

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/chudagang?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/chudagang?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

- [ ] **Step 5: Create .gitignore additions**

Append to the existing `.gitignore`:

```
# env
.env.local
.env.production

# prisma
prisma/migrations/

# superpowers
.superpowers/
```

- [ ] **Step 6: Initialize git repo and commit**

```bash
cd /d/MyProjectCode/chudagang-ai
git init
git add .
git commit -m "chore: initialize Next.js project with core dependencies"
```

---

## Task 2: Design System Tokens & Base UI

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`

- [ ] **Step 1: Write failing test for utils**

Create `tests/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `tests/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/utils.test.ts
```

Expected: FAIL — module `@/lib/utils` not found.

- [ ] **Step 3: Implement utils**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/utils.test.ts
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 5: Configure Tailwind design tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Synthetic Architect Design System
        primary: {
          DEFAULT: "#0F172A",       // Midnight Blue
          container: "#131B2E",
          fixed: "#DAE2FD",
          "fixed-dim": "#BEC6E0",
        },
        secondary: {
          DEFAULT: "#006875",
          container: "#00E3FD",
          fixed: "#9CF0FF",
          "fixed-dim": "#00DAF3",
        },
        tertiary: {
          DEFAULT: "#2D004F",       // Neon Violet base
          container: "#2D004F",
          fixed: "#F1DAFF",
          "fixed-dim": "#DFB7FF",
        },
        accent: {
          cyan: "#00E5FF",          // Electric Cyan
          violet: "#9D00FF",        // Neon Violet
        },
        surface: {
          DEFAULT: "#F9F9F9",
          dim: "#DADADA",
          bright: "#F9F9F9",
          container: {
            DEFAULT: "#EEEEEE",
            low: "#F3F3F4",
            high: "#E8E8E8",
            highest: "#E2E2E2",
            lowest: "#FFFFFF",
          },
        },
        on: {
          surface: "#1A1C1C",
          "surface-variant": "#45464D",
          primary: "#FFFFFF",
          secondary: "#FFFFFF",
          tertiary: "#FFFFFF",
        },
        outline: {
          DEFAULT: "#76777D",
          variant: "#C6C6CD",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Configure global CSS**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-sans: "Inter", system-ui, sans-serif;
  }

  body {
    @apply bg-surface text-on-surface font-sans antialiased;
  }

  /* Ghost Border utility — 20% opacity outline per design system */
  .ghost-border {
    box-shadow: inset 0 0 0 1px rgba(198, 198, 205, 0.2);
  }

  /* Glassmorphism for floating elements */
  .glass {
    @apply bg-surface-container-lowest/70 backdrop-blur-[16px];
  }
}
```

- [ ] **Step 7: Create Button component**

Create `src/components/ui/button.tsx`:

```tsx
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-md hover:opacity-90",
        secondary:
          "bg-surface-container-highest text-on-surface rounded-md hover:bg-surface-container-high",
        tertiary:
          "text-on-surface hover:text-accent-cyan bg-transparent",
        destructive:
          "bg-error text-on-primary rounded-md hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 8: Create Input component**

Create `src/components/ui/input.tsx`:

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 9: Create Card component**

Create `src/components/ui/card.tsx`:

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-surface-container-lowest ghost-border p-6",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-on-surface", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add design system tokens and base UI components"
```

---

## Task 3: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `prisma/seed.ts`
- Test: `tests/lib/db.test.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== Auth (NextAuth) ====================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==================== Core Entities ====================

enum UserRole {
  CLIENT
  DEVELOPER
  ADMIN
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  emailVerified    DateTime?
  name             String?
  avatar           String?
  role             UserRole  @default(CLIENT)
  locale           String    @default("en")
  hashedPassword   String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  accounts         Account[]
  developerProfile DeveloperProfile?
  clientProjects   Project[]        @relation("ClientProjects")
  conversations    Conversation[]
  applications     Application[]
  clientContracts  Contract[]       @relation("ClientContracts")
  devContracts     Contract[]       @relation("DevContracts")
  deliverables     Deliverable[]
  notifications    Notification[]
}

enum ProfileStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
}

model DeveloperProfile {
  id                     String        @id @default(cuid())
  userId                 String        @unique
  displayName            String
  title                  String?
  bio                    String?       @db.Text
  githubUrl              String?
  portfolioUrl           String?
  hourlyRate             Decimal?      @db.Decimal(10, 2)
  currency               String        @default("USD")
  aiRating               Decimal?      @db.Decimal(3, 2)
  verifiedAt             DateTime?
  status                 ProfileStatus @default(PENDING_REVIEW)
  stripeConnectAccountId String?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  skills         DeveloperSkill[]
  availabilities Availability[]
}

model SkillTag {
  id       String @id @default(cuid())
  name     String @unique
  category String
  localeZh String
  localeEn String

  developerSkills DeveloperSkill[]
  projectSkills   ProjectSkill[]
}

model DeveloperSkill {
  profileId  String
  skillTagId String
  profile    DeveloperProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  skillTag   SkillTag         @relation(fields: [skillTagId], references: [id], onDelete: Cascade)

  @@id([profileId, skillTagId])
}

model ProjectSkill {
  projectId  String
  skillTagId String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  skillTag   SkillTag @relation(fields: [skillTagId], references: [id], onDelete: Cascade)

  @@id([projectId, skillTagId])
}

enum AvailabilityStatus {
  AVAILABLE
  BUSY
  TENTATIVE
  BLOCKED
}

model Availability {
  id        String             @id @default(cuid())
  profileId String
  date      DateTime           @db.Date
  startTime String             // "HH:mm" format
  endTime   String             // "HH:mm" format
  status    AvailabilityStatus @default(AVAILABLE)
  note      String?

  profile DeveloperProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, date])
}

// ==================== Projects ====================

enum ProjectStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  DELIVERED
  COMPLETED
  CANCELLED
}

model Project {
  id          String        @id @default(cuid())
  clientId    String
  title       String
  description String        @db.Text
  budget      Decimal?      @db.Decimal(12, 2)
  currency    String        @default("USD")
  category    String?
  aiSummary   String?       @db.Text
  status      ProjectStatus @default(DRAFT)
  visibility  String        @default("PUBLIC")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  client        User           @relation("ClientProjects", fields: [clientId], references: [id])
  skills        ProjectSkill[]
  conversations Conversation[]
  applications  Application[]
  contracts     Contract[]

  @@index([status, createdAt])
}

// ==================== AI Conversations ====================

enum ConversationStatus {
  DISCOVERY
  CONFIRMATION
  MATCHING
  PUBLISHED
  ABANDONED
}

model Conversation {
  id            String             @id @default(cuid())
  userId        String
  projectId     String?
  status        ConversationStatus @default(DISCOVERY)
  modelProvider String             @default("claude")
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  user     User      @relation(fields: [userId], references: [id])
  project  Project?  @relation(fields: [projectId], references: [id])
  messages Message[]
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

model Message {
  id             String      @id @default(cuid())
  conversationId String
  role           MessageRole
  content        String      @db.Text
  metadata       Json?
  createdAt      DateTime    @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}

// ==================== Applications ====================

enum ApplicationStatus {
  PENDING
  SHORTLISTED
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model Application {
  id           String            @id @default(cuid())
  projectId    String
  developerId  String
  coverLetter  String?           @db.Text
  proposedRate Decimal?          @db.Decimal(10, 2)
  status       ApplicationStatus @default(PENDING)
  aiScore      Decimal?          @db.Decimal(5, 2)
  createdAt    DateTime          @default(now())

  project   Project @relation(fields: [projectId], references: [id])
  developer User    @relation(fields: [developerId], references: [id])
  // Access DeveloperProfile via developer.developerProfile

  @@unique([projectId, developerId])
}

// ==================== Contracts ====================

enum ContractStatus {
  DRAFT
  PENDING_SIGN
  ACTIVE
  DELIVERED
  COMPLETED
  DISPUTED
  CANCELLED
}

model Contract {
  id                String         @id @default(cuid())
  projectId         String
  clientId          String
  developerId       String
  title             String
  terms             Json
  totalAmount       Decimal        @db.Decimal(12, 2)
  currency          String         @default("USD")
  status            ContractStatus @default(DRAFT)
  signedByClient    Boolean        @default(false)
  signedByDeveloper Boolean        @default(false)
  signedAt          DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  project      Project       @relation(fields: [projectId], references: [id])
  client       User          @relation("ClientContracts", fields: [clientId], references: [id])
  developer    User          @relation("DevContracts", fields: [developerId], references: [id])
  milestones   Milestone[]
  payments     Payment[]
  deliverables Deliverable[]
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  DELIVERED
  ACCEPTED
  REJECTED
}

model Milestone {
  id          String          @id @default(cuid())
  contractId  String
  title       String
  description String?         @db.Text
  amount      Decimal         @db.Decimal(12, 2)
  dueDate     DateTime?
  order       Int
  status      MilestoneStatus @default(PENDING)

  contract     Contract      @relation(fields: [contractId], references: [id], onDelete: Cascade)
  payments     Payment[]
  deliverables Deliverable[]
}

// ==================== Payments ====================

enum PaymentProvider {
  STRIPE
  ALIPAY
  WECHAT_PAY
}

enum PaymentStatus {
  PENDING
  PROCESSING
  HELD
  RELEASED
  REFUNDED
  FAILED
}

model Payment {
  id                String          @id @default(cuid())
  contractId        String
  milestoneId       String?
  amount            Decimal         @db.Decimal(12, 2)
  currency          String          @default("USD")
  provider          PaymentProvider @default(STRIPE)
  providerPaymentId String?
  providerEventId   String?         @unique
  status            PaymentStatus   @default(PENDING)
  paidAt            DateTime?
  createdAt         DateTime        @default(now())

  contract  Contract   @relation(fields: [contractId], references: [id])
  milestone Milestone? @relation(fields: [milestoneId], references: [id])
}

model ProcessedWebhookEvent {
  id              String   @id @default(cuid())
  providerEventId String   @unique
  provider        String   // STRIPE, STRIPE_CONNECT, ALIPAY, WECHAT_PAY
  processedAt     DateTime @default(now())
}

// ==================== Deliverables ====================

enum DeliverableStatus {
  SUBMITTED
  ACCEPTED
  REJECTED
}

model Deliverable {
  id            String            @id @default(cuid())
  contractId    String
  milestoneId   String?
  title         String
  fileUrl       String?
  description   String?           @db.Text
  uploadedBy    String
  status        DeliverableStatus @default(SUBMITTED)
  reviewComment String?           @db.Text
  createdAt     DateTime          @default(now())

  contract  Contract   @relation(fields: [contractId], references: [id])
  milestone Milestone? @relation(fields: [milestoneId], references: [id])
  uploader  User       @relation(fields: [uploadedBy], references: [id])
}

// ==================== Notifications ====================

enum NotificationType {
  PROJECT_INVITE
  APPLICATION_RECEIVED
  APPLICATION_ACCEPTED
  CONTRACT_READY
  PAYMENT_RECEIVED
  DELIVERY_SUBMITTED
  GENERAL
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType @default(GENERAL)
  title     String
  body      String           @db.Text
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read, createdAt])
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 4: Create seed file**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skillTags = [
  { name: "python", category: "Language", localeZh: "Python", localeEn: "Python" },
  { name: "typescript", category: "Language", localeZh: "TypeScript", localeEn: "TypeScript" },
  { name: "react", category: "Frontend", localeZh: "React", localeEn: "React" },
  { name: "nextjs", category: "Framework", localeZh: "Next.js", localeEn: "Next.js" },
  { name: "langchain", category: "AI", localeZh: "LangChain", localeEn: "LangChain" },
  { name: "openai-api", category: "AI", localeZh: "OpenAI API", localeEn: "OpenAI API" },
  { name: "claude-api", category: "AI", localeZh: "Claude API", localeEn: "Claude API" },
  { name: "rag", category: "AI", localeZh: "RAG 检索增强生成", localeEn: "RAG" },
  { name: "vector-db", category: "AI", localeZh: "向量数据库", localeEn: "Vector Database" },
  { name: "fine-tuning", category: "AI", localeZh: "模型微调", localeEn: "Fine-Tuning" },
  { name: "computer-vision", category: "AI", localeZh: "计算机视觉", localeEn: "Computer Vision" },
  { name: "nlp", category: "AI", localeZh: "自然语言处理", localeEn: "NLP" },
  { name: "mlops", category: "DevOps", localeZh: "MLOps", localeEn: "MLOps" },
  { name: "aws", category: "Cloud", localeZh: "AWS", localeEn: "AWS" },
  { name: "docker", category: "DevOps", localeZh: "Docker", localeEn: "Docker" },
  { name: "postgresql", category: "Database", localeZh: "PostgreSQL", localeEn: "PostgreSQL" },
  { name: "redis", category: "Database", localeZh: "Redis", localeEn: "Redis" },
  { name: "graphql", category: "API", localeZh: "GraphQL", localeEn: "GraphQL" },
  { name: "rust", category: "Language", localeZh: "Rust", localeEn: "Rust" },
  { name: "go", category: "Language", localeZh: "Go", localeEn: "Go" },
];

async function main() {
  console.log("Seeding skill tags...");

  for (const tag of skillTags) {
    await prisma.skillTag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    });
  }

  console.log(`Seeded ${skillTags.length} skill tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 5: Generate Prisma client and push schema**

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

Expected: Schema pushed to database, 20 skill tags seeded.

- [ ] **Step 6: Write DB connection test**

Create `tests/lib/db.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Database", () => {
  it("prisma client module exports db", async () => {
    const { db } = await import("@/lib/db");
    expect(db).toBeDefined();
    expect(typeof db.$connect).toBe("function");
  });
});
```

- [ ] **Step 7: Run test**

```bash
npx vitest run tests/lib/db.test.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add Prisma schema with all entities and seed data"
```

---

## Task 4: NextAuth.js v5 Authentication

**Files:**
- Create: `src/auth.config.ts`
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/redis.ts`

- [ ] **Step 1: Create Redis client**

Create `src/lib/redis.ts`:

```typescript
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

- [ ] **Step 2: Create auth config (edge-compatible)**

Create `src/auth.config.ts`:

```typescript
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Credential validation happens in auth.ts
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
```

- [ ] **Step 3: Create main auth config**

Create `src/auth.ts`:

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
      locale: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  // Note: signIn/newUser pages are NOT set here because they are locale-dependent.
  // The middleware handles auth redirects with locale-aware paths (e.g., /en/login, /zh/login).
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, locale: true },
        });
        token.role = dbUser?.role ?? "CLIENT";
        token.locale = dbUser?.locale ?? "en";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.locale = token.locale as string;
      }
      return session;
    },
  },
  // Declare all providers inline (not patching auth.config.ts) for clarity
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
});
```

- [ ] **Step 4: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 6: Create middleware**

Create `src/middleware.ts`:

> **Note:** Middleware runs on Edge Runtime. Import from `auth.config.ts` (edge-safe), NOT from `auth.ts` (Node.js only, imports Prisma/bcrypt).

```typescript
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createIntlMiddleware(routing);

const publicPaths = ["/", "/login", "/register", "/verify", "/projects", "/developers", "/how-it-works"];

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|zh)/, "") || "/";
  return publicPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(req);

  if (!isPublicPath(pathname) && !req.auth) {
    // Detect locale from pathname for redirect
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add NextAuth.js v5 with email, Google, GitHub providers"
```

---

## Task 5: i18n Setup (next-intl)

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/messages/en.json`
- Create: `src/i18n/messages/zh.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create routing config**

Create `src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
});
```

- [ ] **Step 2: Create navigation helpers**

Create `src/i18n/navigation.ts`:

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

- [ ] **Step 3: Create request config (renamed from Step 2)**

Create `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "zh")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create English messages**

Create `src/i18n/messages/en.json`:

```json
{
  "common": {
    "appName": "ChuDaGang AI",
    "tagline": "AI-Powered Developer Marketplace",
    "login": "Log In",
    "register": "Sign Up",
    "logout": "Log Out",
    "dashboard": "Dashboard",
    "settings": "Settings",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "back": "Back",
    "next": "Next",
    "search": "Search",
    "filter": "Filter"
  },
  "nav": {
    "home": "Home",
    "projects": "Projects",
    "developers": "Find Experts",
    "chat": "AI Assistant",
    "howItWorks": "How It Works"
  },
  "auth": {
    "loginTitle": "Welcome Back",
    "loginSubtitle": "Sign in to your account",
    "registerTitle": "Get Started",
    "registerSubtitle": "Create your account",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "orContinueWith": "Or continue with",
    "google": "Google",
    "github": "GitHub",
    "selectRole": "I want to...",
    "roleClient": "Hire AI Developers",
    "roleDeveloper": "Find AI Projects",
    "roleClientDesc": "Post projects and find the perfect AI developer",
    "roleDeveloperDesc": "Showcase your skills and get matched with projects"
  },
  "landing": {
    "heroTitle": "The AI-Powered Way to Hire AI Talent",
    "heroSubtitle": "Tell our AI what you need. We'll match you with vetted developers, handle contracts, and manage payments — all automatically.",
    "ctaStart": "Start a Conversation",
    "ctaBrowse": "Browse Developers"
  }
}
```

- [ ] **Step 4: Create Chinese messages**

Create `src/i18n/messages/zh.json`:

```json
{
  "common": {
    "appName": "杵大岗AI",
    "tagline": "AI驱动的开发者接单平台",
    "login": "登录",
    "register": "注册",
    "logout": "退出",
    "dashboard": "工作台",
    "settings": "设置",
    "loading": "加载中...",
    "save": "保存",
    "cancel": "取消",
    "submit": "提交",
    "back": "返回",
    "next": "下一步",
    "search": "搜索",
    "filter": "筛选"
  },
  "nav": {
    "home": "首页",
    "projects": "项目大厅",
    "developers": "找专家",
    "chat": "AI助手",
    "howItWorks": "平台介绍"
  },
  "auth": {
    "loginTitle": "欢迎回来",
    "loginSubtitle": "登录你的账号",
    "registerTitle": "开始使用",
    "registerSubtitle": "创建你的账号",
    "email": "邮箱",
    "password": "密码",
    "confirmPassword": "确认密码",
    "forgotPassword": "忘记密码？",
    "noAccount": "还没有账号？",
    "hasAccount": "已有账号？",
    "orContinueWith": "或使用以下方式",
    "google": "Google",
    "github": "GitHub",
    "selectRole": "我想要...",
    "roleClient": "雇佣AI开发者",
    "roleDeveloper": "承接AI项目",
    "roleClientDesc": "发布项目需求，找到最匹配的AI开发者",
    "roleDeveloperDesc": "展示你的技能，被智能匹配到合适的项目"
  },
  "landing": {
    "heroTitle": "用AI的方式，雇佣AI人才",
    "heroSubtitle": "告诉我们你的需求，AI将为你匹配经过验证的开发者，自动处理合同和付款。",
    "ctaStart": "开始对话",
    "ctaBrowse": "浏览开发者"
  }
}
```

- [ ] **Step 5: Update next.config.ts**

Replace `next.config.ts`:

```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add next-intl i18n with zh/en translations"
```

---

## Task 6: Layout, Navigation & Auth Pages

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Create: `src/components/nav.tsx`
- Create: `src/components/footer.tsx`
- Create: `src/components/locale-switcher.tsx`
- Create: `src/components/user-menu.tsx`
- Create: `src/app/[locale]/(auth)/layout.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/app/[locale]/(auth)/register/page.tsx`
- Create: `src/app/[locale]/(public)/layout.tsx`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create shared types**

Create `src/types/index.ts`:

```typescript
export type Locale = "en" | "zh";

export interface PageProps {
  params: Promise<{ locale: Locale }>;
}
```

- [ ] **Step 2: Create root locale layout**

Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/types";
import "@/app/globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create Nav component**

Create `src/components/nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "next-auth/react";

export function Nav() {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();
  const locale = pathname.split("/")[1] || "en";

  const links = [
    { href: `/${locale}`, label: t("nav.home") },
    { href: `/${locale}/projects`, label: t("nav.projects") },
    { href: `/${locale}/developers`, label: t("nav.developers") },
    { href: `/${locale}/how-it-works`, label: t("nav.howItWorks") },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-outline-variant/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="text-lg font-bold text-primary">
            {t("common.appName")}
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Button variant="tertiary" size="sm" asChild>
                <Link href={`/${locale}/login`}>{t("common.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/register`}>{t("common.register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Create LocaleSwitcher**

Create `src/components/locale-switcher.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const targetLocale = locale === "en" ? "zh" : "en";

  function switchLocale() {
    router.replace(pathname, { locale: targetLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="text-sm text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-md hover:bg-surface-container transition-colors"
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
```

- [ ] **Step 5: Create UserMenu**

Create `src/components/user-menu.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface UserMenuProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const dashboardPath = user.role === "DEVELOPER"
    ? `/${locale}/dashboard/developer`
    : `/${locale}/dashboard/client`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-medium">
          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="glass rounded-lg p-2 min-w-[180px] ghost-border z-50"
          sideOffset={8}
          align="end"
        >
          <div className="px-3 py-2 border-b border-outline-variant/10 mb-1">
            <p className="text-sm font-medium text-on-surface">{user.name || user.email}</p>
            <p className="text-xs text-on-surface-variant">{user.email}</p>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href={dashboardPath}
              className="flex items-center px-3 py-2 text-sm text-on-surface rounded-md hover:bg-surface-container-high cursor-pointer outline-none"
            >
              {t("dashboard")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link
              href={`/${locale}/settings`}
              className="flex items-center px-3 py-2 text-sm text-on-surface rounded-md hover:bg-surface-container-high cursor-pointer outline-none"
            >
              {t("settings")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-outline-variant/10" />
          <DropdownMenu.Item
            onClick={() => signOut()}
            className="flex items-center px-3 py-2 text-sm text-error rounded-md hover:bg-error-container/30 cursor-pointer outline-none"
          >
            {t("logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

- [ ] **Step 6: Create Footer**

Create `src/components/footer.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-outline-variant/10 bg-surface-container-low">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} {t("appName")}
          </p>
          <p className="text-sm text-on-surface-variant">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 7: Create auth layout (no nav)**

Create `src/app/[locale]/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low p-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 8: Create login page**

Create `src/app/[locale]/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl });
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("loginTitle")}</CardTitle>
        <p className="text-sm text-on-surface-variant">{t("loginSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">{t("email")}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("password")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tc("loading") : tc("login")}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/20" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-container-lowest px-2 text-on-surface-variant">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => signIn("google", { callbackUrl })}
          >
            {t("google")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => signIn("github", { callbackUrl })}
          >
            {t("github")}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-on-surface-variant">
          {t("noAccount")}{" "}
          <Link href="./register" className="text-accent-cyan hover:underline">
            {tc("register")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 9: Create register page**

Create `src/app/[locale]/(auth)/register/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<"CLIENT" | "DEVELOPER">("CLIENT");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });
    if (res.ok) {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: role === "DEVELOPER"
          ? `/${locale}/dashboard/developer`
          : `/${locale}/dashboard/client`,
      });
    }
    setLoading(false);
  }

  if (step === "role") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("registerTitle")}</CardTitle>
          <p className="text-sm text-on-surface-variant">{t("selectRole")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => { setRole("CLIENT"); setStep("form"); }}
            className="w-full rounded-xl p-4 text-left ghost-border hover:bg-surface-container transition-colors"
          >
            <p className="font-medium text-on-surface">{t("roleClient")}</p>
            <p className="text-sm text-on-surface-variant mt-1">{t("roleClientDesc")}</p>
          </button>
          <button
            onClick={() => { setRole("DEVELOPER"); setStep("form"); }}
            className="w-full rounded-xl p-4 text-left ghost-border hover:bg-surface-container transition-colors"
          >
            <p className="font-medium text-on-surface">{t("roleDeveloper")}</p>
            <p className="text-sm text-on-surface-variant mt-1">{t("roleDeveloperDesc")}</p>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container-lowest px-2 text-on-surface-variant">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => signIn("google")}>
              {t("google")}
            </Button>
            <Button variant="secondary" onClick={() => signIn("github")}>
              {t("github")}
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-on-surface-variant">
            {t("hasAccount")}{" "}
            <Link href="./login" className="text-accent-cyan hover:underline">
              {tc("login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("registerTitle")}</CardTitle>
        <p className="text-sm text-on-surface-variant">{t("registerSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("email")}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("password")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tc("loading") : tc("register")}
          </Button>
        </form>
        <button
          onClick={() => setStep("role")}
          className="mt-4 text-sm text-on-surface-variant hover:text-on-surface w-full text-center"
        >
          {tc("back")}
        </button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10: Create register API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, name, password, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const validRole: UserRole = role === "DEVELOPER" ? "DEVELOPER" : "CLIENT";

    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: validRole,
      },
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 11: Create public layout**

Create `src/app/[locale]/(public)/layout.tsx`:

```tsx
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 12: Create landing page placeholder**

Create `src/app/[locale]/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // For now redirect to the public layout — landing page will be built in Plan 3
  redirect(`/${locale}/projects`);
}
```

Alternatively, a simple placeholder:

Replace with:

```tsx
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SessionProvider } from "next-auth/react";

export default function LandingPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            杵大岗AI
          </h1>
          <p className="mt-4 text-lg text-on-surface-variant">
            AI-Powered Developer Marketplace
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild>
              <Link href={`/${params.locale}/chat`}>Start a Conversation</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/${params.locale}/developers`}>Browse Developers</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 13: Verify the app runs**

```bash
npm run dev
```

Open `http://localhost:3000` — should show landing placeholder.
Open `http://localhost:3000/en/login` — should show login form.
Open `http://localhost:3000/zh/login` — should show Chinese login form.

- [ ] **Step 14: Commit**

```bash
git add .
git commit -m "feat: add layout, navigation, auth pages with i18n"
```

---

## Task 7: Smoke Test & Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors (warnings OK).

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Manual verification checklist**

```bash
npm run dev
```

Verify:
- [ ] Landing page loads at `/en` and `/zh`
- [ ] Language switcher toggles between EN/中文
- [ ] `/en/login` shows login form with Google/GitHub buttons
- [ ] `/zh/login` shows Chinese translations
- [ ] `/en/register` shows role selection (Client/Developer)
- [ ] Register → creates user in DB → redirects to dashboard path
- [ ] Login → authenticates → shows user menu in nav
- [ ] User menu dropdown shows Dashboard, Settings, Logout
- [ ] Protected routes redirect to login when unauthenticated

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: Plan 1 Foundation complete — scaffolding, DB, auth, i18n"
```

---

## Summary

After completing this plan, you will have:
- Next.js 16 project with TypeScript strict mode
- Complete Prisma schema (all 15 entities from spec) with PostgreSQL
- 20 seeded skill tags
- NextAuth.js v5 with email/password + Google + GitHub OAuth
- JWT sessions with role-based access
- i18n (zh/en) with next-intl
- Design system tokens matching Stitch "Synthetic Architect"
- Base UI components (Button, Input, Card)
- Navigation with auth state, locale switcher, user menu
- Login and Register pages (with role selection)
- Middleware for auth guards + i18n routing
- Ready for Plan 2 (Developer System)
