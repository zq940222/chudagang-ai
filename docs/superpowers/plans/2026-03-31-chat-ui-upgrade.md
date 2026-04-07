# Chat UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversation history sidebar to the chat pages and upgrade the visual quality of the chat interface.

**Architecture:** Create a shared chat layout (`layout.tsx`) containing `Nav` + sidebar + content area. The sidebar is a server component calling `getMyConversations()`. The chat interface receives style-only upgrades — no logic changes.

**Tech Stack:** Next.js App Router, React Server Components, Tailwind CSS, Prisma (existing), next-intl (existing)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/[locale]/chat/layout.tsx` | Create | Shared layout: Nav + sidebar + children |
| `src/components/chat/chat-sidebar.tsx` | Create | Conversation list sidebar (server component) |
| `src/app/[locale]/chat/page.tsx` | Modify | Remove Nav, simplify to auth + ChatInterface |
| `src/app/[locale]/chat/[conversationId]/page.tsx` | Modify | Remove Nav, simplify to auth + data fetch + ChatInterface |
| `src/components/chat/chat-interface.tsx` | Modify | Visual upgrades: empty state, input bar, message spacing |

---

### Task 1: Create Chat Layout

**Files:**
- Create: `src/app/[locale]/chat/layout.tsx`

- [ ] **Step 1: Create the layout file**

```tsx
import { Nav } from "@/components/nav";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <Nav />
      <div className="flex flex-1 min-h-0">
        <ChatSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create a stub ChatSidebar so the layout compiles**

Create `src/components/chat/chat-sidebar.tsx` with a minimal placeholder:

```tsx
export function ChatSidebar() {
  return (
    <aside className="hidden lg:flex w-72 flex-col bg-surface-container-lowest ghost-border">
      <p className="p-4 text-sm text-on-surface-variant">Loading...</p>
    </aside>
  );
}
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20` or `npm run dev` and check no errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/chat/layout.tsx" "src/components/chat/chat-sidebar.tsx"
git commit -m "feat(chat): add shared chat layout with sidebar stub"
```

---

### Task 2: Simplify Chat Page Files

**Files:**
- Modify: `src/app/[locale]/chat/page.tsx`
- Modify: `src/app/[locale]/chat/[conversationId]/page.tsx`

- [ ] **Step 1: Simplify `/chat/page.tsx`**

Replace full content with:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale } = await params;

  return (
    <ChatInterface locale={locale as "zh" | "en"} className="flex-1 min-h-0" />
  );
}
```

- [ ] **Step 2: Simplify `/chat/[conversationId]/page.tsx`**

Replace full content with:

```tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getConversation } from "@/lib/actions/conversation";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale, conversationId } = await params;

  const result = await getConversation(conversationId);
  if (result.error || !result.data) notFound();

  return (
    <ChatInterface
      conversationId={conversationId}
      locale={locale as "zh" | "en"}
      className="flex-1 min-h-0"
    />
  );
}
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20` or check dev server — pages should render identically to before (Nav now comes from layout).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/chat/page.tsx" "src/app/[locale]/chat/[conversationId]/page.tsx"
git commit -m "refactor(chat): move Nav to layout, simplify page files"
```

---

### Task 3: Build Chat Sidebar Component

**Files:**
- Modify: `src/components/chat/chat-sidebar.tsx`

- [ ] **Step 1: Replace the stub with the full sidebar implementation**

Replace the entire file content with:

```tsx
import { getMyConversations } from "@/lib/actions/conversation";
import { Link } from "@/i18n/navigation";

const statusColors: Record<string, string> = {
  DISCOVERY: "bg-accent-cyan",
  CONFIRMATION: "bg-amber-400",
  MATCHING: "bg-violet-500",
  PUBLISHED: "bg-green-500",
  ABANDONED: "bg-on-surface-variant/30",
};

function groupByDate(conversations: { updatedAt: string }[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: typeof conversations = [];
  const thisWeek: typeof conversations = [];
  const earlier: typeof conversations = [];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= todayStart) today.push(c);
    else if (d >= weekStart) thisWeek.push(c);
    else earlier.push(c);
  }

  return { today, thisWeek, earlier };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export async function ChatSidebar({
  activeConversationId,
}: {
  activeConversationId?: string;
}) {
  const result = await getMyConversations();
  const conversations = result.data ?? [];
  const { today, thisWeek, earlier } = groupByDate(conversations);

  const renderGroup = (
    label: string,
    items: typeof conversations,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          {label}
        </p>
        {items.map((c) => {
          const isActive = c.id === activeConversationId;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${
                isActive
                  ? "bg-surface-container"
                  : "hover:bg-surface-container"
              }`}
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusColors[c.status] ?? "bg-on-surface-variant/30"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">
                  {c.project?.title ?? "New Chat"}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {c.messageCount} message{c.messageCount !== 1 ? "s" : ""} · {relativeTime(c.updatedAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-surface-container-lowest ghost-border shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-black shadow-lg">
          AI
        </div>
        <span className="text-sm font-bold text-on-surface tracking-tight">
          AI Consultant
        </span>
      </div>

      {/* New Chat button */}
      <div className="px-4 pb-2">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-on-primary text-sm font-bold py-2.5 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Chat
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-5 py-8 text-xs text-on-surface-variant text-center">
            No conversations yet
          </p>
        ) : (
          <>
            {renderGroup("Today", today)}
            {renderGroup("This Week", thisWeek)}
            {renderGroup("Earlier", earlier)}
          </>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Update layout.tsx to pass `activeConversationId` prop**

The layout does not have access to the `conversationId` param directly. Since the sidebar is a server component rendered in the layout, and the `conversationId` is only available in the nested page route, we need to use `usePathname` on the client side. Convert the sidebar to accept no prop and extract the active ID from the URL internally.

Replace the `ChatSidebar` export to be a client wrapper + server data pattern. Actually, the simpler approach: make the layout pass `children` only, and have the sidebar extract the active conversation ID from the URL client-side.

Update `chat-sidebar.tsx` — change the component to be a client component that fetches conversations via a wrapper pattern:

Instead, keep it as a server component but **don't highlight active state from props**. Use a small client wrapper for the active highlight. The simplest approach:

Create the sidebar as a **server component that renders a client list component**:

Replace `src/components/chat/chat-sidebar.tsx` with:

```tsx
import { getMyConversations } from "@/lib/actions/conversation";
import { ChatSidebarClient } from "./chat-sidebar-client";

export async function ChatSidebar() {
  const result = await getMyConversations();
  const conversations = result.data ?? [];
  return <ChatSidebarClient conversations={conversations} />;
}
```

Create `src/components/chat/chat-sidebar-client.tsx`:

```tsx
"use client";

import { usePathname, Link } from "@/i18n/navigation";

interface Conversation {
  id: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  project: { id: string; title: string; status: string } | null;
}

const statusColors: Record<string, string> = {
  DISCOVERY: "bg-accent-cyan",
  CONFIRMATION: "bg-amber-400",
  MATCHING: "bg-violet-500",
  PUBLISHED: "bg-green-500",
  ABANDONED: "bg-on-surface-variant/30",
};

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: Conversation[] = [];
  const thisWeek: Conversation[] = [];
  const earlier: Conversation[] = [];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= todayStart) today.push(c);
    else if (d >= weekStart) thisWeek.push(c);
    else earlier.push(c);
  }

  return { today, thisWeek, earlier };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ChatSidebarClient({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const pathname = usePathname();
  // pathname is like /chat/clxxx... — extract conversation ID
  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/")[2]
    : undefined;

  const { today, thisWeek, earlier } = groupByDate(conversations);

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          {label}
        </p>
        {items.map((c) => {
          const isActive = c.id === activeId;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${
                isActive
                  ? "bg-surface-container"
                  : "hover:bg-surface-container"
              }`}
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusColors[c.status] ?? "bg-on-surface-variant/30"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">
                  {c.project?.title ?? "New Chat"}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {c.messageCount} message{c.messageCount !== 1 ? "s" : ""} ·{" "}
                  {relativeTime(c.updatedAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-surface-container-lowest ghost-border shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-black shadow-lg">
          AI
        </div>
        <span className="text-sm font-bold text-on-surface tracking-tight">
          AI Consultant
        </span>
      </div>

      {/* New Chat button */}
      <div className="px-4 pb-2">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-on-primary text-sm font-bold py-2.5 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Chat
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-5 py-8 text-xs text-on-surface-variant text-center">
            No conversations yet
          </p>
        ) : (
          <>
            {renderGroup("Today", today)}
            {renderGroup("This Week", thisWeek)}
            {renderGroup("Earlier", earlier)}
          </>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Verify the sidebar renders alongside the chat interface**

Run dev server, navigate to `/chat`. The sidebar should appear on the left (on desktop) with the "New Chat" button and any existing conversations.

- [ ] **Step 4: Commit**

```bash
git add "src/components/chat/chat-sidebar.tsx" "src/components/chat/chat-sidebar-client.tsx"
git commit -m "feat(chat): implement conversation history sidebar"
```

---

### Task 4: Upgrade ChatInterface Empty State

**Files:**
- Modify: `src/components/chat/chat-interface.tsx`

- [ ] **Step 1: Upgrade the empty state section**

In `src/components/chat/chat-interface.tsx`, find the empty state block (the `{isEmpty && (` section, approximately lines 70–102). Replace it with:

```tsx
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-4xl font-black shadow-2xl shadow-primary/20">
              AI
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
                {locale === "zh"
                  ? "准备好开始了吗？"
                  : "Ready to start?"}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {locale === "zh"
                  ? "描述您的项目构思，我将为您精准提取需求并匹配顶尖开发者。"
                  : "Describe your project idea, and I'll extract requirements and find the best developers for you."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
              <button
                onClick={() => sendMessage({ text: locale === "zh" ? "我想做一个移动应用" : "I want to build a mobile app" })}
                className="flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left"
              >
                <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <span className="text-xs font-bold text-on-surface">
                  {locale === "zh" ? "移动应用" : "Mobile App"}
                </span>
                <span className="text-[11px] text-on-surface-variant leading-snug">
                  {locale === "zh" ? "构建 iOS 或 Android 应用" : "Build an iOS or Android app"}
                </span>
              </button>
              <button
                onClick={() => sendMessage({ text: locale === "zh" ? "我需要一个网站" : "I need a website" })}
                className="flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left"
              >
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="text-xs font-bold text-on-surface">
                  {locale === "zh" ? "网站开发" : "Website"}
                </span>
                <span className="text-[11px] text-on-surface-variant leading-snug">
                  {locale === "zh" ? "设计并开发现代网站" : "Design and build a modern website"}
                </span>
              </button>
              <button
                onClick={() => sendMessage({ text: locale === "zh" ? "我需要 AI 技术咨询" : "I need AI technical consulting" })}
                className="flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left"
              >
                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <span className="text-xs font-bold text-on-surface">
                  {locale === "zh" ? "AI 咨询" : "AI Guidance"}
                </span>
                <span className="text-[11px] text-on-surface-variant leading-snug">
                  {locale === "zh" ? "获取 AI 技术方案建议" : "Get AI technical consulting"}
                </span>
              </button>
            </div>
          </div>
        )}
```

- [ ] **Step 2: Verify the empty state renders correctly**

Run dev server, navigate to `/chat` (not an existing conversation). The empty state should show a larger avatar, title with `font-extrabold`, and 3 quick-action cards in a grid.

- [ ] **Step 3: Commit**

```bash
git add "src/components/chat/chat-interface.tsx"
git commit -m "feat(chat): upgrade empty state with card grid and larger avatar"
```

---

### Task 5: Upgrade ChatInterface Input Bar

**Files:**
- Modify: `src/components/chat/chat-interface.tsx`

- [ ] **Step 1: Upgrade the input bar**

In `src/components/chat/chat-interface.tsx`, find the `<form>` block (approximately lines 210–247). Replace the entire `<form>` element with:

```tsx
      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex-shrink-0 p-4 sm:p-6"
      >
        <div className="relative max-w-3xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 to-tertiary/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 glass rounded-2xl p-2 ghost-border shadow-2xl shadow-primary/5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === "zh" ? "描述您的项目需求..." : "Describe your project needs..."
              }
              disabled={isBusy}
              className="flex-1 border-none focus-visible:ring-0 bg-transparent text-base py-6 rounded-2xl"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isBusy || !input.trim()}
              className="rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0 bg-gradient-to-r from-primary to-accent-cyan border-none shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </Button>
          </div>
        </div>
      </form>
```

This removes the "AI Guided Requirement Extraction" footer text, uses `glass` class on the input container, uses `rounded-2xl` on the input, and adds gradient to the send button.

- [ ] **Step 2: Verify the input bar**

Run dev server, check the input bar has glass effect, gradient send button, and no footer text.

- [ ] **Step 3: Commit**

```bash
git add "src/components/chat/chat-interface.tsx"
git commit -m "feat(chat): upgrade input bar with glass effect and gradient button"
```

---

### Task 6: Upgrade Message Area Styling

**Files:**
- Modify: `src/components/chat/chat-interface.tsx`

- [ ] **Step 1: Upgrade the loading indicator avatar**

In `src/components/chat/chat-interface.tsx`, find the loading indicator section (the `{isBusy && (` block). Change the avatar div from:

```tsx
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-bold">
```

to:

```tsx
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-bold shadow-lg">
```

(Added `shadow-lg`)

- [ ] **Step 2: Add hover effect to tool output cards**

In the `tool-extractRequirements` render case, change:

```tsx
                      <ProjectSummaryCard
                        key={`${message.id}-tool-${i}`}
                        project={part.output as {
```

to:

```tsx
                      <ProjectSummaryCard
                        key={`${message.id}-tool-${i}`}
                        className="hover:shadow-md transition-shadow"
                        project={part.output as {
```

In the `tool-searchDevelopers` render case, change:

```tsx
                      <DeveloperRecommendations
                        key={`${message.id}-tool-${i}`}
                        developers={result.developers}
```

to:

```tsx
                      <DeveloperRecommendations
                        key={`${message.id}-tool-${i}`}
                        className="hover:shadow-md transition-shadow"
                        developers={result.developers}
```

- [ ] **Step 3: Verify the upgrades**

Run dev server, check that loading dots avatar has shadow, and tool output cards have hover shadow effect.

- [ ] **Step 4: Commit**

```bash
git add "src/components/chat/chat-interface.tsx"
git commit -m "feat(chat): add shadow and hover effects to message area"
```
