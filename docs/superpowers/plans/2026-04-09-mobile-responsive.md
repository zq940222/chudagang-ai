# Mobile Responsive Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all pages responsive for mobile devices (< 768px) with hamburger navigation, collapsible filters, and adaptive layouts.

**Architecture:** Pure CSS/Tailwind changes on existing components. Nav gets a hamburger menu with useState. FilterSidebar gets a mobile toggle. Dashboard sidebar items merge into Nav on mobile. Chat uses URL-based view switching.

**Tech Stack:** Tailwind CSS v4 responsive classes, React useState, next-intl

---

### Task 1: Nav — Add Hamburger Menu for Mobile

**Files:**
- Modify: `src/components/nav.tsx`

This is the most complex task. The Nav needs a hamburger button visible at `md:hidden`, and a mobile menu overlay with all links + optional dashboard links.

- [ ] **Step 1: Add dashboardLinks prop and mobile menu state**

In `src/components/nav.tsx`, update the component to accept an optional prop and add state:

```tsx
// Add at top of file, after existing imports:
import { useState } from "react";

// Change type for dashboardLinks prop
type DashboardLink = {
  href: string;
  label: string;
  icon: string;
};

export function Nav({ dashboardLinks }: { dashboardLinks?: DashboardLink[] } = {}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

- [ ] **Step 2: Add hamburger button in the right section**

In the `{/* Right: Search + actions + auth */}` div, add a hamburger button as the FIRST child (before the search bar div):

```tsx
          {/* Mobile hamburger */}
          <button
            className="md:hidden rounded-xl p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
```

- [ ] **Step 3: Add mobile menu overlay after the closing `</nav>` tag but before closing `</header>`**

```tsx
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-3 right-3 mt-2 z-50">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="liquid-glass-vivid liquid-panel rounded-[1.75rem] p-4 shadow-2xl space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  isActiveLink(pathname, link.href)
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Dashboard links (when on dashboard routes) */}
            {dashboardLinks && dashboardLinks.length > 0 && (
              <>
                <div className="my-2 border-t border-outline-variant/20" />
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      isActiveLink(pathname, link.href)
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    )}
                  >
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {/* Auth section for mobile */}
            {status !== "loading" && !session?.user && (
              <>
                <div className="my-2 border-t border-outline-variant/20" />
                <div className="flex gap-2 px-2 py-2">
                  <Button variant="tertiary" size="sm" className="flex-1" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>{tc("login")}</Link>
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1 rounded-xl" asChild>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>{tc("register")}</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 4: Hide the desktop auth buttons on mobile**

Change the existing desktop auth buttons div (the `<div className="flex items-center gap-2">` containing login/register) to include `hidden md:flex`:

```tsx
            <div className="hidden items-center gap-2 md:flex">
```

- [ ] **Step 5: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: add mobile hamburger menu to Nav with dashboard links support"
```

---

### Task 2: Dashboard Sidebars — Export Link Data + Layout Integration

**Files:**
- Modify: `src/components/dashboard/client-sidebar.tsx`
- Modify: `src/components/dashboard/developer-sidebar.tsx`
- Modify: `src/app/[locale]/dashboard/client/layout.tsx`
- Modify: `src/app/[locale]/dashboard/developer/layout.tsx`

- [ ] **Step 1: Export link data from client sidebar**

In `src/components/dashboard/client-sidebar.tsx`, export the links array and make it non-const for reuse:

Add before the component function:

```typescript
export const clientSidebarLinks = sidebarLinks;
```

- [ ] **Step 2: Export link data from developer sidebar**

In `src/components/dashboard/developer-sidebar.tsx`, add:

```typescript
export const developerSidebarLinks = sidebarLinks;
```

- [ ] **Step 3: Update client dashboard layout to pass links to Nav**

Replace `src/app/[locale]/dashboard/client/layout.tsx` entirely:

```tsx
import { Nav } from "@/components/nav";
import { ClientSidebar, clientSidebarLinks } from "@/components/dashboard/client-sidebar";
import { getTranslations } from "next-intl/server";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("clientSidebar");

  const dashboardLinks = clientSidebarLinks.map((link) => ({
    href: link.href,
    label: t(link.labelKey),
    icon: link.icon,
  }));

  return (
    <>
      <Nav dashboardLinks={dashboardLinks} />
      <div className="mx-auto flex max-w-screen-2xl flex-1 gap-10 px-4 py-6 md:px-6 md:py-12 lg:px-16">
        <ClientSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Update developer dashboard layout**

Replace `src/app/[locale]/dashboard/developer/layout.tsx` entirely:

```tsx
import { Nav } from "@/components/nav";
import { DeveloperSidebar, developerSidebarLinks } from "@/components/dashboard/developer-sidebar";
import { getTranslations } from "next-intl/server";

export default async function DeveloperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("devSidebar");

  const dashboardLinks = developerSidebarLinks.map((link) => ({
    href: link.href,
    label: t(link.labelKey),
    icon: link.icon,
  }));

  return (
    <>
      <Nav dashboardLinks={dashboardLinks} />
      <div className="mx-auto flex max-w-screen-2xl flex-1 gap-10 px-4 py-6 md:px-6 md:py-12 lg:px-16">
        <DeveloperSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/client-sidebar.tsx src/components/dashboard/developer-sidebar.tsx src/app/[locale]/dashboard/client/layout.tsx src/app/[locale]/dashboard/developer/layout.tsx
git commit -m "feat: integrate dashboard sidebar links into Nav for mobile"
```

---

### Task 3: FilterSidebar — Mobile Collapsible Toggle

**Files:**
- Modify: `src/components/filters/filter-sidebar.tsx`

The FilterSidebar currently uses `hidden lg:flex`. We need to make it visible on mobile as a collapsible section.

- [ ] **Step 1: Add mobile toggle state and responsive rendering**

In `src/components/filters/filter-sidebar.tsx`, add `useState` import (already imported). Replace the outer `<aside>` element and its className. Change from:

```tsx
    <aside className="hidden w-64 shrink-0 flex-col space-y-8 border-r border-outline-variant/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))] p-6 lg:flex">
```

To:

```tsx
    <aside className="w-full shrink-0 flex-col space-y-8 border-b border-outline-variant/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))] p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
```

Then add a `mobileFilterOpen` state at the top of the FilterSidebar component:

```typescript
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
```

Wrap the category `<nav>` and range controls in a div that's hidden on mobile unless toggled:

Before the category `<div>` that contains the `<h5>` and `<nav>`, add a mobile toggle button:

```tsx
      {/* Mobile filter toggle */}
      <button
        className="flex w-full items-center justify-between lg:hidden"
        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
      >
        <h5 className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
          Marketplace Filters
        </h5>
        <svg
          className={cn("w-5 h-5 text-on-surface-variant transition-transform", mobileFilterOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
```

Then wrap the existing filter content (the `<div>` with categories nav, range controls, and reset button) in:

```tsx
      <div className={cn("space-y-8", !mobileFilterOpen && "hidden lg:block")}>
        {/* ... existing category list, range, reset ... */}
      </div>
```

The desktop `<h5>Marketplace Filters</h5>` inside the wrapped content should get `hidden lg:block` so it doesn't double up.

- [ ] **Step 2: Commit**

```bash
git add src/components/filters/filter-sidebar.tsx
git commit -m "feat: add mobile collapsible toggle to FilterSidebar"
```

---

### Task 4: Public List Pages — Responsive Grid Layout

**Files:**
- Modify: `src/app/[locale]/(public)/projects/page.tsx`
- Modify: `src/app/[locale]/(public)/developers/page.tsx`

These pages need their main layout changed from side-by-side (filter + content) to stacked on mobile.

- [ ] **Step 1: Update projects page layout**

In `src/app/[locale]/(public)/projects/page.tsx`, find the outer flex container that holds the filter sidebar and content area. Change it from a `flex` with sidebar hidden on mobile to a vertical stack:

Change the container that wraps `<ProjectFilterSidebar />` and the content `<div>` from:
```tsx
<div className="flex ...">
```
to use responsive classes:
```tsx
<div className="flex flex-col lg:flex-row ...">
```

Also ensure the project card grid uses responsive columns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

- [ ] **Step 2: Update developers page layout**

Same pattern for `src/app/[locale]/(public)/developers/page.tsx`:
- Container: `flex flex-col lg:flex-row`
- Card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/projects/page.tsx src/app/[locale]/(public)/developers/page.tsx
git commit -m "feat: make project and developer list pages responsive"
```

---

### Task 5: Landing Page Components — Responsive CSS

**Files:**
- Modify: `src/components/landing/hero-section.tsx`
- Modify: `src/components/landing/categories-bento.tsx`
- Modify: `src/components/landing/features-section.tsx`
- Modify: `src/components/landing/how-it-works-section.tsx`
- Modify: `src/components/landing/featured-experts.tsx`
- Modify: `src/components/landing/trusted-by-section.tsx`
- Modify: `src/components/landing/velocity-cta.tsx`
- Modify: `src/components/footer.tsx`

All changes are CSS class adjustments only.

- [ ] **Step 1: hero-section.tsx**

Change the title `<h1>` from `text-5xl ... lg:text-7xl` to `text-3xl sm:text-5xl lg:text-7xl`.

Change the section padding from `px-8 py-24 sm:py-28` to `px-4 py-16 sm:px-8 sm:py-24`.

The right panel already has `hidden lg:block` which is correct.

- [ ] **Step 2: categories-bento.tsx**

Change section padding from `px-8 py-24` to `px-4 py-16 sm:px-8 sm:py-24`.

The grid already uses `grid-cols-1 ... md:grid-cols-12` which handles mobile.

- [ ] **Step 3: features-section.tsx**

Change the grid from `sm:grid-cols-3` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

- [ ] **Step 4: how-it-works-section.tsx**

Grid already uses `sm:grid-cols-2 lg:grid-cols-4` which is good. Just reduce section padding on mobile: `px-4 sm:px-6`.

- [ ] **Step 5: featured-experts.tsx**

Change section padding from `px-8 py-24` to `px-4 py-16 sm:px-8 sm:py-24`.

The expert card grid already uses `md:grid-cols-2` which stacks on mobile.

In the expert card, the header flex with avatar and rate side by side may overflow on small screens. Change from `flex items-start justify-between` to `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`.

- [ ] **Step 6: trusted-by-section.tsx**

Change logo gap from `gap-12 ... md:gap-20` to `gap-6 sm:gap-12 md:gap-20`.

Reduce outer padding from `px-8` to `px-4 sm:px-8`.

- [ ] **Step 7: velocity-cta.tsx**

Change section padding from `px-8 py-24` to `px-4 py-16 sm:px-8 sm:py-24`.

The step grid already uses `md:grid-cols-4` which stacks on mobile.

Change the title from `text-4xl` to `text-2xl sm:text-4xl`.

- [ ] **Step 8: footer.tsx**

Footer grid already uses `grid-cols-1 md:grid-cols-4`. Just reduce padding from `px-8` to `px-4 sm:px-8`.

- [ ] **Step 9: Commit**

```bash
git add src/components/landing/ src/components/footer.tsx
git commit -m "feat: make landing page components responsive for mobile"
```

---

### Task 6: Public Detail Pages — Responsive Layout

**Files:**
- Modify: `src/app/[locale]/(public)/projects/[id]/page.tsx`
- Modify: `src/app/[locale]/(public)/developers/[id]/page.tsx`

- [ ] **Step 1: Project detail page**

In `src/app/[locale]/(public)/projects/[id]/page.tsx`, find the main grid layout. It should use `grid-cols-1 lg:grid-cols-3` (if not already). The sidebar content should stack below the main content on mobile.

Reduce section padding for mobile: `px-4 sm:px-6 lg:px-8`.

- [ ] **Step 2: Developer detail page**

Already uses `grid-cols-1 lg:grid-cols-3`. The sticky sidebar card should not be sticky on mobile — change `sticky top-24` to `lg:sticky lg:top-24`.

Reduce section padding: `px-4 sm:px-6 lg:px-8`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/projects/[id]/page.tsx src/app/[locale]/(public)/developers/[id]/page.tsx
git commit -m "feat: make public detail pages responsive"
```

---

### Task 7: Chat — Mobile View Switching

**Files:**
- Modify: `src/app/[locale]/chat/layout.tsx`
- Modify: `src/components/chat/chat-sidebar-client.tsx`

- [ ] **Step 1: Update chat layout for mobile view switching**

In `src/app/[locale]/chat/layout.tsx`, the sidebar should show full-screen on mobile when at `/chat` (no conversationId), and hide when viewing a conversation. This is already partially handled by the existing mobile overlay pattern.

Update the layout to pass a `children` check — the sidebar is already handled by `ChatSidebarClient` with its overlay pattern. The main change needed:

In the `<div className="flex flex-1 min-h-0">`, add responsive classes so the sidebar shows on mobile only at the chat index:

```tsx
<div className="flex flex-1 min-h-0">
  <ChatSidebar />
  <main className="flex-1 min-w-0 hidden lg:block">{children}</main>
</div>
```

Actually, a simpler approach: the existing overlay pattern already works. We just need to ensure the chat sidebar shows as full-width on mobile at `/chat` and the main content shows at `/chat/[id]`. This can be handled client-side.

Add a `MobileChatWrapper` client component inline or modify the layout to conditionally render based on the current path.

The simplest approach: In `chat-sidebar-client.tsx`, change the desktop sidebar to also show on mobile (removing `hidden lg:flex`), and let the conversation page override it. But this breaks the conversation view.

Better: Keep the layout as-is. The mobile overlay is already functional. Just ensure the chat index page (`/chat/page.tsx`) shows a prompt to open sidebar on mobile, or auto-opens it.

For now, the existing overlay pattern is sufficient. Skip complex view-switching — the sidebar overlay already works on mobile and users can toggle it.

- [ ] **Step 2: Commit (if changes made)**

```bash
git add src/app/[locale]/chat/layout.tsx
git commit -m "feat: optimize chat layout for mobile"
```

---

### Task 8: Lint and Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Fix any issues found, then commit fixes if needed**

```bash
git add -A
git commit -m "fix: resolve lint and type errors in mobile responsive changes"
```
