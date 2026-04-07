# Chat UI Upgrade — Sidebar + Visual Enhancement

**Date:** 2026-03-31
**Scope:** Chat pages (`/chat`, `/chat/[conversationId]`)
**Approach:** Lightweight sidebar (Option A) with visual upgrades

---

## 1. Layout Architecture

### New: `src/app/[locale]/chat/layout.tsx`

Server component wrapping all chat pages. Moves `Nav` from individual pages into the layout.

```
Nav (sticky header)
├── Sidebar (w-72, left)
└── Main content (flex-1, children)
```

- Flex row layout, matching dashboard pattern: `flex flex-1 gap-0`
- Sidebar hidden on mobile by default, toggled via client-side button
- Both `page.tsx` files simplified — remove `Nav`, keep only auth + data fetch + `<ChatInterface />`

### File changes:
- **Create:** `src/app/[locale]/chat/layout.tsx`
- **Modify:** `src/app/[locale]/chat/page.tsx` — remove Nav import/render
- **Modify:** `src/app/[locale]/chat/[conversationId]/page.tsx` — remove Nav import/render

---

## 2. Chat Sidebar Component

### New: `src/components/chat/chat-sidebar.tsx`

Server component. Calls `getMyConversations()` from `src/lib/actions/conversation.ts`.

**Structure:**
- Header: gradient AI icon + "AI Consultant" title
- New Chat button: `Link` to `/chat`, primary styled button
- Conversation list: grouped by date (Today / This Week / Earlier)

**Each conversation item displays:**
- Status color dot (DISCOVERY=cyan, CONFIRMATION=amber, MATCHING=violet, PUBLISHED=green, ABANDONED=muted)
- Title: project title if linked, otherwise "New Chat"
- Meta line: message count + relative time (e.g., "3 messages · 2h ago")
- Active conversation highlighted with `bg-surface-container`

**Styling:**
- `w-72 bg-surface-container-lowest ghost-border` (right border)
- `hover:bg-surface-container transition-colors` on items
- Scrollable list with `overflow-y-auto`

**Mobile behavior:**
- Hidden by default (`hidden lg:flex`)
- Toggle button visible on mobile in the chat header area

**No new server actions needed.** Uses existing `getMyConversations()`.

---

## 3. ChatInterface Visual Upgrades

Modify `src/components/chat/chat-interface.tsx`. Style-only changes, no logic changes.

### 3a. Empty State

- AI avatar: 24x24 (up from 20x20), add `shadow-2xl`
- Quick actions: 3 cards in grid layout (`grid grid-cols-1 sm:grid-cols-3 gap-3`)
  - Each card: `ghost-border` + icon + title + short description
  - Card 1: "Describe Your Project" (existing)
  - Card 2: "Find Developers" (existing)
  - Card 3: "Get AI Guidance" (new prompt)
- Add slogan text below heading

### 3b. Input Bar

- Glass background: `glass` class on input container
- Input: `rounded-2xl` with larger padding
- Send button: `bg-gradient-to-r from-primary to-accent-cyan` gradient
- Remove "AI Guided Requirement Extraction" footer text

### 3c. Message Area

- Increase message spacing: `space-y-6` (from current tighter spacing)
- AI avatar: add `shadow-lg`
- Tool output cards: add subtle `hover:shadow-md transition-shadow`

### Not changed:
- `useChat` hook logic, API integration, streaming
- Component props interfaces (MessageBubble, ProjectSummaryCard, DeveloperRecommendations)
- Loading animation (bouncing dots)
- Error display

---

## 4. Component Inventory

| File | Action | Description |
|------|--------|-------------|
| `src/app/[locale]/chat/layout.tsx` | Create | Nav + sidebar + children layout |
| `src/components/chat/chat-sidebar.tsx` | Create | Conversation list sidebar |
| `src/app/[locale]/chat/page.tsx` | Modify | Remove Nav, simplify |
| `src/app/[locale]/chat/[conversationId]/page.tsx` | Modify | Remove Nav, simplify |
| `src/components/chat/chat-interface.tsx` | Modify | Visual upgrades (empty state, input, spacing) |

---

## 5. Design Tokens Used

- Backgrounds: `surface-container-lowest`, `surface-container`, `glass`
- Borders: `ghost-border`
- Colors: `primary`, `accent-cyan`, `tertiary`
- Status mapping: cyan (DISCOVERY), amber (CONFIRMATION), violet (MATCHING), green (PUBLISHED), muted (ABANDONED)
- Transitions: `transition-colors`, `transition-shadow`
