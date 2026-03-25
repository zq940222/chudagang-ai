# Plan 3: Project & AI — Marketplace, Conversation & Matching

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI-driven core: project publishing (AI-assisted + manual), AI conversation with streaming, and smart developer matching — the primary differentiator of 杵大岗AI.

**Architecture:** Vercel AI SDK for streaming chat with Tool Calling. Server Actions for project CRUD. Matching engine combines DB queries (hard filter) with AI re-ranking (soft sort). Conversations are independent entities that can optionally link to projects.

**Tech Stack:** Vercel AI SDK (useChat + streamText + tool), Prisma 7, Server Actions, next-intl

**Spec reference:** `docs/superpowers/specs/2026-03-24-project-hall-ai-marketplace-design.md`

**Depends on:** Plan 1 (Foundation) + Plan 2 (Developer System) — completed

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/
│   │   │   └── projects/
│   │   │       ├── page.tsx                      # Project marketplace listing
│   │   │       └── [id]/page.tsx                 # Project detail
│   │   ├── chat/
│   │   │   ├── page.tsx                          # New conversation entry
│   │   │   └── [conversationId]/page.tsx         # Conversation UI (streaming)
│   │   └── dashboard/
│   │       └── client/
│   │           ├── layout.tsx                    # Client dashboard layout
│   │           ├── page.tsx                      # Client overview
│   │           └── projects/
│   │               ├── page.tsx                  # My projects list
│   │               └── new/page.tsx              # Manual project creation
│   ├── api/
│   │   ├── chat/route.ts                         # AI streaming endpoint
│   │   └── projects/route.ts                     # Projects CRUD API
├── lib/
│   ├── actions/
│   │   ├── project.ts                            # Project server actions
│   │   └── conversation.ts                       # Conversation server actions
│   ├── ai/
│   │   ├── gateway.ts                            # Multi-model gateway
│   │   ├── tools.ts                              # AI tool definitions
│   │   └── system-prompt.ts                      # Phase-aware system prompts
│   ├── services/
│   │   └── matching.ts                           # (extend) Add project-developer matching
│   └── validators/
│       └── project.ts                            # Project Zod validators
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx                    # Main chat UI
│   │   ├── message-bubble.tsx                    # Single message display
│   │   ├── developer-recommendation.tsx          # Developer card in chat
│   │   └── project-summary-card.tsx              # Project summary in chat
│   ├── project/
│   │   ├── project-card.tsx                      # Project card for listing
│   │   ├── project-form.tsx                      # Manual project creation form
│   │   └── project-detail-view.tsx               # Full project detail
│   └── dashboard/
│       └── client-sidebar.tsx                    # Client dashboard sidebar
└── types/
    └── project.ts                                # Project-specific types
```

---

## Task 1: Project Types, Validators & Server Actions

**Files:**
- Create: `src/types/project.ts`
- Create: `src/lib/validators/project.ts`
- Create: `src/lib/actions/project.ts`
- Create: `src/lib/actions/conversation.ts`

- [ ] **Step 1: Create project types**

Create `src/types/project.ts`:

```typescript
import type { Project, SkillTag, User, Contract } from "@prisma/client";

export type ProjectWithDetails = Project & {
  client: Pick<User, "id" | "name" | "avatar">;
  skills: { skillTag: SkillTag }[];
  _count?: { applications: number };
};

export type ProjectCardData = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  currency: string;
  category: string | null;
  status: string;
  skills: { id: string; name: string; localeZh: string; localeEn: string }[];
  clientName: string | null;
  applicationCount: number;
  createdAt: string;
};

export type ProjectSearchParams = {
  query?: string;
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  page?: number;
  limit?: number;
};
```

- [ ] **Step 2: Create project validators**

Create `src/lib/validators/project.ts`:

```typescript
import { z } from "zod";

export const projectCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  budget: z.coerce.number().min(0).optional(),
  currency: z.enum(["USD", "CNY", "EUR"]).default("USD"),
  category: z.string().max(100).optional(),
  skillTagIds: z.array(z.string()).min(1, "Select at least one skill"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
```

- [ ] **Step 3: Create project server actions**

Create `src/lib/actions/project.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validators/project";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    budget: formData.get("budget"),
    currency: formData.get("currency"),
    category: formData.get("category"),
    skillTagIds: formData.getAll("skillTagIds"),
    visibility: formData.get("visibility"),
  };

  const parsed = projectCreateSchema.parse(raw);
  const { skillTagIds, ...projectData } = parsed;

  const project = await db.project.create({
    data: {
      ...projectData,
      budget: projectData.budget ?? null,
      clientId: session.user.id,
      status: "PUBLISHED",
      skills: {
        create: skillTagIds.map((id) => ({ skillTagId: id })),
      },
    },
  });

  revalidatePath("/dashboard/client/projects");
  return { success: true, projectId: project.id };
}

export async function createProjectFromAI(data: {
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  category?: string;
  skillTagIds: string[];
  aiSummary?: string;
  conversationId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db.project.create({
    data: {
      title: data.title,
      description: data.description,
      budget: data.budget ?? null,
      currency: data.currency ?? "USD",
      category: data.category ?? null,
      aiSummary: data.aiSummary ?? null,
      clientId: session.user.id,
      status: "DRAFT",
      skills: {
        create: data.skillTagIds.map((id) => ({ skillTagId: id })),
      },
    },
  });

  // Link conversation to project if provided
  if (data.conversationId) {
    await db.conversation.update({
      where: { id: data.conversationId },
      data: { projectId: project.id },
    });
  }

  return { success: true, projectId: project.id };
}

export async function updateProjectStatus(projectId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.clientId !== session.user.id) throw new Error("Unauthorized");

  await db.project.update({
    where: { id: projectId },
    data: { status: status as "DRAFT" | "PUBLISHED" | "CANCELLED" },
  });

  revalidatePath("/dashboard/client/projects");
  return { success: true };
}

export async function getMyProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.project.findMany({
    where: { clientId: session.user.id },
    include: {
      skills: { include: { skillTag: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function searchProjects(params: {
  query?: string;
  skills?: string[];
  page?: number;
  limit?: number;
}) {
  const { query, skills, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "PUBLISHED", visibility: "PUBLIC" };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (skills && skills.length > 0) {
    where.skills = { some: { skillTag: { name: { in: skills } } } };
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, avatar: true } },
        skills: { include: { skillTag: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  return { projects, total };
}
```

- [ ] **Step 4: Create conversation server actions**

Create `src/lib/actions/conversation.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function createConversation() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conversation = await db.conversation.create({
    data: {
      userId: session.user.id,
      status: "DISCOVERY",
      modelProvider: "openai",
    },
  });

  return conversation;
}

export async function getConversation(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.conversation.findUnique({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      project: { select: { id: true, title: true, status: true } },
    },
  });
}

export async function getMyConversations() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.conversation.findMany({
    where: { userId: session.user.id },
    include: {
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateConversationStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.conversation.update({
    where: { id, userId: session.user.id },
    data: { status: status as "DISCOVERY" | "CONFIRMATION" | "MATCHING" | "PUBLISHED" | "ABANDONED" },
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add project types, validators, and server actions"
```

---

## Task 2: AI Gateway, Tools & System Prompts

**Files:**
- Create: `src/lib/ai/gateway.ts`
- Create: `src/lib/ai/tools.ts`
- Create: `src/lib/ai/system-prompt.ts`

- [ ] **Step 1: Create multi-model gateway**

Create `src/lib/ai/gateway.ts`:

```typescript
import { openai } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "claude" | "qwen";

const models: Record<ModelProvider, () => ReturnType<typeof openai>> = {
  openai: () => openai("gpt-4o-mini"),
  claude: () => openai("gpt-4o-mini"), // TODO: swap to @ai-sdk/anthropic in production
  qwen: () => openai("gpt-4o-mini"),   // TODO: swap to custom provider
};

export function getModel(provider: ModelProvider = "openai") {
  const factory = models[provider] ?? models.openai;
  return factory();
}
```

- [ ] **Step 2: Create AI tool definitions**

Create `src/lib/ai/tools.ts`:

```typescript
import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { searchDevelopers } from "@/lib/services/matching";

export const aiTools = {
  extractRequirements: tool({
    description: "Extract structured project requirements from the conversation. Call this when you have enough information about what the user needs.",
    parameters: z.object({
      title: z.string().describe("Short project title"),
      description: z.string().describe("Detailed project description"),
      skills: z.array(z.string()).describe("Required skill names (e.g. python, react, langchain)"),
      budgetMin: z.number().optional().describe("Minimum budget in USD"),
      budgetMax: z.number().optional().describe("Maximum budget in USD"),
      timelineWeeks: z.number().optional().describe("Estimated timeline in weeks"),
      category: z.string().optional().describe("Project category (e.g. RAG Chatbot, Computer Vision)"),
    }),
    execute: async ({ title, description, skills, budgetMin, budgetMax, timelineWeeks, category }) => {
      // Find matching skill tag IDs
      const skillTags = await db.skillTag.findMany({
        where: { name: { in: skills, mode: "insensitive" } },
      });

      return {
        title,
        description,
        skills: skillTags.map((s) => ({ id: s.id, name: s.name })),
        budgetRange: budgetMin && budgetMax ? `$${budgetMin} - $${budgetMax}` : "To be discussed",
        timelineWeeks: timelineWeeks ?? null,
        category: category ?? "General AI",
        status: "requirements_extracted",
      };
    },
  }),

  searchDevelopers: tool({
    description: "Search for matching developers based on project requirements. Call this after requirements are confirmed to find suitable developers.",
    parameters: z.object({
      skills: z.array(z.string()).describe("Required skill names to filter by"),
      maxRate: z.number().optional().describe("Maximum hourly rate in USD"),
      limit: z.number().default(5).describe("Number of developers to return"),
    }),
    execute: async ({ skills, maxRate, limit }) => {
      const result = await searchDevelopers({
        skills,
        maxRate,
        limit,
      });

      return {
        developers: result.developers.map((d) => ({
          id: d.id,
          name: d.displayName,
          title: d.title,
          rating: d.aiRating,
          rate: d.hourlyRate ? `$${d.hourlyRate}/hr` : "Negotiable",
          skills: d.skills.map((s) => s.name).join(", "),
        })),
        total: result.total,
        status: "developers_found",
      };
    },
  }),

  estimateBudget: tool({
    description: "Estimate a reasonable budget range for the project based on requirements.",
    parameters: z.object({
      complexity: z.enum(["simple", "medium", "complex"]).describe("Project complexity level"),
      timelineWeeks: z.number().describe("Estimated weeks to complete"),
      skillCount: z.number().describe("Number of specialized skills required"),
    }),
    execute: async ({ complexity, timelineWeeks, skillCount }) => {
      const baseRates = { simple: 50, medium: 80, complex: 120 };
      const weeklyHours = 30;
      const base = baseRates[complexity] * weeklyHours * timelineWeeks;
      const skillMultiplier = 1 + (skillCount - 1) * 0.1;
      const min = Math.round(base * skillMultiplier * 0.8);
      const max = Math.round(base * skillMultiplier * 1.2);

      return {
        estimatedMin: min,
        estimatedMax: max,
        currency: "USD",
        reasoning: `Based on ${complexity} complexity, ${timelineWeeks} weeks, ${skillCount} specialized skills`,
      };
    },
  }),
};
```

- [ ] **Step 3: Create system prompt manager**

Create `src/lib/ai/system-prompt.ts`:

```typescript
export type ConversationPhase = "DISCOVERY" | "CONFIRMATION" | "MATCHING" | "PUBLISHED";

export function getSystemPrompt(phase: ConversationPhase, locale: string = "en"): string {
  const isZh = locale === "zh";

  const base = isZh
    ? `你是杵大岗AI的项目顾问，帮助雇主理清AI项目需求并匹配合适的开发者。
规则：
- 用中文回复
- 一次只问一个问题
- 不要泄露内部逻辑或工具名称
- 保持专业友好的态度`
    : `You are the project consultant for ChuDaGang AI, helping employers clarify AI project requirements and match with suitable developers.
Rules:
- Respond in English
- Ask one question at a time
- Never expose internal logic or tool names
- Stay professional and friendly`;

  const phaseInstructions: Record<ConversationPhase, string> = {
    DISCOVERY: isZh
      ? `当前阶段：需求探索
你的任务：通过对话了解项目需求。需要了解：
1. 项目类型（RAG、计算机视觉、NLP等）
2. 具体功能需求
3. 预算范围
4. 时间要求
5. 技术偏好

当你收集到足够信息后，使用 extractRequirements 工具提取结构化需求。`
      : `Current phase: Discovery
Your task: Understand project requirements through conversation. Learn about:
1. Project type (RAG, Computer Vision, NLP, etc.)
2. Specific feature requirements
3. Budget range
4. Timeline requirements
5. Technical preferences

When you have enough information, use the extractRequirements tool to extract structured requirements.`,

    CONFIRMATION: isZh
      ? `当前阶段：需求确认
需求已提取。向用户展示项目摘要，询问是否需要修改。
如果用户确认，使用 searchDevelopers 工具查找匹配的开发者。`
      : `Current phase: Confirmation
Requirements have been extracted. Show the project summary to the user and ask if changes are needed.
If the user confirms, use the searchDevelopers tool to find matching developers.`,

    MATCHING: isZh
      ? `当前阶段：开发者匹配
已找到匹配的开发者。向用户介绍推荐的开发者，说明推荐理由。
帮助用户做出选择，或者调整筛选条件重新搜索。`
      : `Current phase: Developer Matching
Matching developers have been found. Present the recommended developers with reasons.
Help the user make a choice, or adjust filters to search again.`,

    PUBLISHED: isZh
      ? `当前阶段：项目已发布
项目已发布到市场。告知用户下一步流程：
- 开发者会看到并申请项目
- 用户可以在工作台查看申请
- 也可以主动邀请之前推荐的开发者`
      : `Current phase: Project Published
The project has been published. Inform the user about next steps:
- Developers will see and apply to the project
- User can review applications in the dashboard
- They can also invite previously recommended developers`,
  };

  return `${base}\n\n${phaseInstructions[phase]}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add AI gateway, tools, and system prompts"
```

---

## Task 3: Chat API Streaming Endpoint

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create streaming chat endpoint**

Create `src/app/api/chat/route.ts`:

```typescript
import { streamText } from "ai";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/gateway";
import { aiTools } from "@/lib/ai/tools";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import type { ConversationPhase } from "@/lib/ai/system-prompt";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = await req.json();

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await db.conversation.findUnique({
      where: { id: conversationId, userId: session.user.id },
    });
  }

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        status: "DISCOVERY",
        modelProvider: "openai",
      },
    });
  }

  const phase = (conversation.status as ConversationPhase) || "DISCOVERY";
  const locale = session.user.locale || "en";
  const systemPrompt = getSystemPrompt(phase, locale);

  // Save user message
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === "user") {
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: lastUserMessage.content,
      },
    });
  }

  const result = streamText({
    model: getModel(conversation.modelProvider as "openai" | "claude" | "qwen"),
    system: systemPrompt,
    messages,
    tools: aiTools,
    maxSteps: 3,
    onFinish: async ({ text, toolCalls }) => {
      // Save assistant message
      if (text) {
        await db.message.create({
          data: {
            conversationId: conversation!.id,
            role: "ASSISTANT",
            content: text,
            metadata: toolCalls ? { toolCalls } : undefined,
          },
        });
      }

      // Auto-advance conversation phase based on tool usage
      if (toolCalls?.length) {
        const toolNames = toolCalls.map((tc: { toolName: string }) => tc.toolName);
        let newStatus = conversation!.status;

        if (toolNames.includes("extractRequirements") && phase === "DISCOVERY") {
          newStatus = "CONFIRMATION";
        } else if (toolNames.includes("searchDevelopers") && phase === "CONFIRMATION") {
          newStatus = "MATCHING";
        }

        if (newStatus !== conversation!.status) {
          await db.conversation.update({
            where: { id: conversation!.id },
            data: { status: newStatus },
          });
        }
      }
    },
  });

  return result.toDataStreamResponse({
    headers: { "X-Conversation-Id": conversation.id },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add AI chat streaming endpoint with tool calling"
```

---

## Task 4: Chat UI Components

**Files:**
- Create: `src/components/chat/chat-interface.tsx`
- Create: `src/components/chat/message-bubble.tsx`
- Create: `src/components/chat/developer-recommendation.tsx`
- Create: `src/components/chat/project-summary-card.tsx`

- [ ] **Step 1: Create message bubble**

Create `src/components/chat/message-bubble.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  children?: React.ReactNode;
}

export function MessageBubble({ role, content, children }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-3 mb-4", role === "user" ? "justify-end" : "justify-start")}>
      {role === "assistant" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-bold">
          AI
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          role === "user"
            ? "bg-primary text-on-primary rounded-br-md"
            : "bg-surface-container-low text-on-surface rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create developer recommendation component**

Create `src/components/chat/developer-recommendation.tsx`:

```tsx
interface DeveloperRecommendation {
  id: string;
  name: string;
  title: string | null;
  rating: number | null;
  rate: string;
  skills: string;
}

interface Props {
  developers: DeveloperRecommendation[];
  locale: string;
}

export function DeveloperRecommendations({ developers, locale }: Props) {
  return (
    <div className="mt-3 space-y-2">
      {developers.map((dev, i) => (
        <a
          key={dev.id}
          href={`/${locale}/developers/${dev.id}`}
          className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-3 ghost-border hover:bg-surface-container transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan font-bold text-sm">
            #{i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-on-surface text-sm">{dev.name}</p>
            {dev.title && <p className="text-xs text-on-surface-variant truncate">{dev.title}</p>}
            <p className="text-xs text-on-surface-variant mt-0.5">{dev.skills}</p>
          </div>
          <div className="text-right shrink-0">
            {dev.rating && <p className="text-sm font-medium text-accent-cyan">{dev.rating.toFixed(1)}</p>}
            <p className="text-xs text-on-surface-variant">{dev.rate}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create project summary card**

Create `src/components/chat/project-summary-card.tsx`:

```tsx
interface ProjectSummary {
  title: string;
  description: string;
  skills: { id: string; name: string }[];
  budgetRange: string;
  timelineWeeks: number | null;
  category: string;
}

interface Props {
  summary: ProjectSummary;
}

export function ProjectSummaryCard({ summary }: Props) {
  return (
    <div className="mt-3 rounded-lg bg-surface-container-lowest p-4 ghost-border">
      <h4 className="font-semibold text-on-surface text-sm">{summary.title}</h4>
      <p className="mt-1 text-xs text-on-surface-variant line-clamp-3">{summary.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {summary.skills.map((s) => (
          <span key={s.id} className="rounded-full bg-accent-cyan/10 px-2 py-0.5 text-xs text-accent-cyan">
            {s.name}
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-on-surface-variant">
        <span>Budget: {summary.budgetRange}</span>
        {summary.timelineWeeks && <span>Timeline: {summary.timelineWeeks}w</span>}
        <span>Category: {summary.category}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create main chat interface**

Create `src/components/chat/chat-interface.tsx`:

```tsx
"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { DeveloperRecommendations } from "./developer-recommendation";
import { ProjectSummaryCard } from "./project-summary-card";

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: { id: string; role: "user" | "assistant"; content: string }[];
}

export function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    api: "/api/chat",
    body: { conversationId },
    initialMessages,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-cyan/10">
                <span className="text-2xl text-accent-cyan font-bold">AI</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">
                {locale === "zh" ? "你好！我是杵大岗AI助手" : "Hi! I'm ChuDaGang AI Assistant"}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {locale === "zh"
                  ? "告诉我你的项目需求，我会帮你找到最合适的AI开发者。"
                  : "Tell me about your project needs, and I'll help you find the perfect AI developer."}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role as "user" | "assistant"} content={msg.content}>
            {/* Render tool results inline */}
            {msg.toolInvocations?.map((invocation: { toolName: string; state: string; result?: Record<string, unknown> }, i: number) => {
              if (invocation.state !== "result" || !invocation.result) return null;

              if (invocation.toolName === "extractRequirements") {
                return <ProjectSummaryCard key={i} summary={invocation.result as unknown as { title: string; description: string; skills: { id: string; name: string }[]; budgetRange: string; timelineWeeks: number | null; category: string }} />;
              }

              if (invocation.toolName === "searchDevelopers" && invocation.result.developers) {
                return <DeveloperRecommendations key={i} developers={invocation.result.developers as unknown as { id: string; name: string; title: string | null; rating: number | null; rate: string; skills: string }[]} locale={locale} />;
              }

              return null;
            })}
          </MessageBubble>
        ))}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={locale === "zh" ? "描述你的项目需求..." : "Describe your project needs..."}
            className="flex-1 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30 ghost-border"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? t("loading") : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add chat UI components (interface, bubble, recommendations)"
```

---

## Task 5: Chat Pages & Project Pages

**Files:**
- Create: `src/app/[locale]/chat/page.tsx`
- Create: `src/app/[locale]/chat/[conversationId]/page.tsx`
- Create: `src/app/[locale]/(public)/projects/page.tsx`
- Create: `src/app/[locale]/(public)/projects/[id]/page.tsx`
- Create: `src/components/project/project-card.tsx`

- [ ] **Step 1: Create chat entry page**

Create `src/app/[locale]/chat/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  return (
    <div className="flex h-screen flex-col">
      <Nav />
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create conversation page**

Create `src/app/[locale]/chat/[conversationId]/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getConversation } from "@/lib/actions/conversation";
import { Nav } from "@/components/nav";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { conversationId } = await params;
  const conversation = await getConversation(conversationId);
  if (!conversation) notFound();

  const initialMessages = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role.toLowerCase() as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="flex h-screen flex-col">
      <Nav />
      <div className="flex-1 overflow-hidden">
        <ChatInterface conversationId={conversationId} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create project card**

Create `src/components/project/project-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useLocale } from "next-intl";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    currency: string;
    status: string;
    skills: { skillTag: { id: string; name: string; localeZh: string; localeEn: string } }[];
    _count?: { applications: number };
    createdAt: Date | string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/projects/${project.id}`}>
      <Card className="hover:bg-surface-container-low transition-colors cursor-pointer h-full">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-on-surface">{project.title}</h3>
          <span className="shrink-0 rounded-full bg-accent-cyan/10 px-2 py-0.5 text-xs text-accent-cyan">
            {project.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{project.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills.slice(0, 4).map((s) => (
            <span
              key={s.skillTag.id}
              className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant"
            >
              {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-on-surface-variant">
          {project.budget && (
            <span className="font-medium text-on-surface">
              {project.currency === "CNY" ? "¥" : "$"}{Number(project.budget).toLocaleString()}
            </span>
          )}
          {project._count && (
            <span>{project._count.applications} applicant{project._count.applications !== 1 ? "s" : ""}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Create projects listing page**

Create `src/app/[locale]/(public)/projects/page.tsx`:

```tsx
import { searchProjects } from "@/lib/actions/project";
import { ProjectCard } from "@/components/project/project-card";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await searchProjects({
    query: typeof params.query === "string" ? params.query : undefined,
    skills: typeof params.skills === "string" ? params.skills.split(",") : undefined,
    page: typeof params.page === "string" ? Number(params.page) : 1,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Project Marketplace</h1>

      {result.projects.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">No projects available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-on-surface-variant">
        {result.total} project{result.total !== 1 ? "s" : ""} available
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create project detail page**

Create `src/app/[locale]/(public)/projects/[id]/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const project = await db.project.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      client: { select: { name: true, avatar: true, createdAt: true } },
      skills: { include: { skillTag: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Card>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{project.title}</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Posted by {project.client.name ?? "Anonymous"} · {project._count.applications} applicant{project._count.applications !== 1 ? "s" : ""}
              </p>
            </div>
            {project.budget && (
              <div className="text-right">
                <p className="text-xl font-bold text-on-surface">
                  {project.currency === "CNY" ? "¥" : "$"}{Number(project.budget).toLocaleString()}
                </p>
                <p className="text-xs text-on-surface-variant">{project.currency}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Description</h2>
            <p className="text-sm text-on-surface whitespace-pre-wrap">{project.description}</p>
          </div>

          {project.aiSummary && (
            <div className="mt-4 rounded-lg bg-accent-cyan/5 p-4">
              <h3 className="text-sm font-semibold text-accent-cyan mb-1">AI Summary</h3>
              <p className="text-sm text-on-surface">{project.aiSummary}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((s) => (
                <span key={s.skillTag.id} className="rounded-full bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant">
                  {locale === "zh" ? s.skillTag.localeZh : s.skillTag.localeEn}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Button asChild className="w-full">
              <Link href={`/${locale}/login`}>Apply to this Project</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add chat pages and project marketplace pages"
```

---

## Task 6: Client Dashboard

**Files:**
- Create: `src/components/dashboard/client-sidebar.tsx`
- Create: `src/app/[locale]/dashboard/client/layout.tsx`
- Create: `src/app/[locale]/dashboard/client/page.tsx`
- Create: `src/app/[locale]/dashboard/client/projects/page.tsx`
- Create: `src/app/[locale]/dashboard/client/projects/new/page.tsx`
- Create: `src/components/project/project-form.tsx`

- [ ] **Step 1: Create client sidebar**

Create `src/components/dashboard/client-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const links = [
    { href: `/${locale}/dashboard/client`, label: "Overview", icon: "📊" },
    { href: `/${locale}/dashboard/client/projects`, label: "My Projects", icon: "📁" },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-outline-variant/10 bg-surface-container-low p-4">
      <h2 className="mb-4 px-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
        Dashboard
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

- [ ] **Step 2: Create client dashboard layout and pages**

Create `src/app/[locale]/dashboard/client/layout.tsx`:

```tsx
import { ClientSidebar } from "@/components/dashboard/client-sidebar";
import { Nav } from "@/components/nav";

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex flex-1">
        <ClientSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

Create `src/app/[locale]/dashboard/client/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProjects } from "@/lib/actions/project";
import { getMyConversations } from "@/lib/actions/conversation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale } = await params;
  const [projects, conversations] = await Promise.all([getMyProjects(), getMyConversations()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Client Dashboard</h1>
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/${locale}/chat`}>AI Assistant</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/${locale}/dashboard/client/projects/new`}>Post Project</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatsCard title="Active Projects" value={projects.filter((p) => p.status === "PUBLISHED" || p.status === "IN_PROGRESS").length} />
        <StatsCard title="Total Projects" value={projects.length} />
        <StatsCard title="AI Conversations" value={conversations.length} />
      </div>
    </div>
  );
}
```

Create `src/app/[locale]/dashboard/client/projects/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProjects } from "@/lib/actions/project";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MyProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale } = await params;
  const projects = await getMyProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">My Projects</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/client/projects/new`}>New Project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">No projects yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create project form and new project page**

Create `src/components/project/project-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkillSelector } from "@/components/developer/skill-selector";
import { createProject } from "@/lib/actions/project";

interface SkillTag {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
}

export function ProjectForm({ skillTags }: { skillTags: SkillTag[] }) {
  const tc = useTranslations("common");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createProject(formData);
    } catch (error) {
      console.error("Project create error:", error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">Project Title *</label>
            <Input name="title" required placeholder="e.g. Build a RAG Chatbot for Customer Support" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Description *</label>
            <textarea
              name="description"
              required
              minLength={20}
              rows={6}
              placeholder="Describe your project requirements in detail..."
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-on-surface">Budget</label>
              <Input name="budget" type="number" placeholder="5000" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface">Currency</label>
              <select
                name="currency"
                defaultValue="USD"
                className="mt-1 h-10 w-full rounded-md bg-surface-container-lowest px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              >
                <option value="USD">USD ($)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Category</label>
            <Input name="category" placeholder="e.g. RAG Chatbot, Computer Vision" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Required Skills *</label>
            <div className="mt-1">
              <SkillSelector skills={skillTags} selected={selectedSkills} onChange={setSelectedSkills} />
            </div>
          </div>

          <input type="hidden" name="visibility" value="PUBLIC" />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tc("loading") : "Publish Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

Create `src/app/[locale]/dashboard/client/projects/new/page.tsx`:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSkillTags } from "@/lib/actions/profile";
import { ProjectForm } from "@/components/project/project-form";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const skillTags = await getSkillTags();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Post a New Project</h1>
      <ProjectForm skillTags={skillTags} />
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx vitest run
npm run lint
npm run build
git add .
git commit -m "feat: add client dashboard, project form, and project pages"
git push origin main
```

---

## Summary

After completing this plan:
- **AI Chat with streaming** — 4-phase conversation (Discovery → Confirmation → Matching → Published)
- **Tool Calling** — extractRequirements, searchDevelopers, estimateBudget
- **Multi-model gateway** — configurable (openai for MVP, extensible)
- **Project marketplace** — listing with search, detail pages
- **Manual project posting** — form with skill selector
- **Client dashboard** — overview, project management
- **Chat pages** — new conversation + resume existing
- Ready for Plan 4 (Transaction — contracts, payments, delivery)
