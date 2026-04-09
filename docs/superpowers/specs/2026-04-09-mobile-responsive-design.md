# Mobile Responsive Adaptation Design

> Date: 2026-04-09
> Status: Approved

## Overview

Full-site mobile responsive adaptation for the ChuDaGang AI marketplace. All pages — Landing, public pages, Dashboard, and Chat — will be made responsive. Approach: minimal modifications to existing components using Tailwind responsive classes. No new layout abstractions.

## Approach

- Add responsive Tailwind classes (`sm:`, `md:`, `lg:`) to existing components
- Nav gets a hamburger menu for mobile with overlay
- Dashboard sidebar items merge into Nav's hamburger menu on mobile
- Chat uses view-switching (list ↔ chat) on mobile
- No new shared layout components or abstractions

## 1. Navigation (Nav)

### Current State
- Desktop links use `hidden md:flex`, disappear on mobile with no fallback
- Component is currently a server component

### Changes
- Convert Nav to `"use client"` (needs useState for menu toggle)
- Add hamburger button: visible only at `md:hidden`
- Mobile menu overlay contains:
  - All nav links (Home, Projects, Developers, Chat)
  - Dashboard sidebar items (when on a dashboard route, passed via optional `dashboardLinks` prop)
  - Locale switcher
  - User menu (login/register or avatar+logout)
- Clicking a menu item or overlay backdrop closes the menu
- Hamburger animates to X when open

### Dashboard Sidebar Integration
- `client-sidebar.tsx` and `developer-sidebar.tsx` export their link data as constants
- Dashboard layouts pass these links to Nav via `dashboardLinks` prop
- On mobile (`< md`), sidebar components are hidden; their links appear in Nav's hamburger menu
- On desktop (`>= md`), sidebar renders normally, `dashboardLinks` prop is ignored by Nav

### Files
- Modify: `src/components/nav.tsx`
- Modify: `src/components/dashboard/client-sidebar.tsx` — export link data
- Modify: `src/components/dashboard/developer-sidebar.tsx` — export link data
- Modify: `src/app/[locale]/dashboard/client/layout.tsx` — pass links to Nav
- Modify: `src/app/[locale]/dashboard/developer/layout.tsx` — pass links to Nav

## 2. Landing Page Components

### Principle
- Multi-column grids → single column on mobile: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Large headings shrink: `text-3xl md:text-5xl lg:text-7xl`
- Padding reduces: `px-4 sm:px-6 lg:px-8`
- Horizontal flex → vertical on mobile: `flex-col md:flex-row`

### Files
- Modify: `src/components/landing/hero-section.tsx` — title sizes, metrics layout, CTA buttons
- Modify: `src/components/landing/categories-bento.tsx` — grid columns
- Modify: `src/components/landing/features-section.tsx` — feature cards grid
- Modify: `src/components/landing/how-it-works-section.tsx` — steps layout
- Modify: `src/components/landing/featured-experts.tsx` — expert cards grid
- Modify: `src/components/landing/trusted-by-section.tsx` — logo layout
- Modify: `src/components/landing/velocity-cta.tsx` — steps layout
- Modify: `src/components/footer.tsx` — link columns

### No Logic Changes
Pure CSS class adjustments. No component logic changes.

## 3. Public Pages (Projects, Developers)

### List Pages
- Filter sidebar collapses on mobile into a toggleable section (click "Filter" button to expand/collapse)
- Content area goes full-width on mobile
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for cards

### Detail Pages
- Project detail: right sidebar info moves below main content on mobile
- Developer detail: right Rate/Availability card moves below main content on mobile
- Layout: `grid-cols-1 lg:grid-cols-3` (already partially in place)

### Files
- Modify: `src/app/[locale]/(public)/projects/page.tsx` — grid breakpoints
- Modify: `src/app/[locale]/(public)/developers/page.tsx` — grid breakpoints
- Modify: `src/components/project/project-filter-sidebar.tsx` — mobile collapsible
- Modify: `src/components/developer/developer-filter-sidebar.tsx` — mobile collapsible
- Modify: `src/app/[locale]/(public)/projects/[id]/page.tsx` — detail layout
- Modify: `src/app/[locale]/(public)/developers/[id]/page.tsx` — detail layout

## 4. Dashboard Pages

### Layout Changes
- Sidebar hidden on mobile (items merged into Nav hamburger menu — see Section 1)
- Content area: full-width on mobile, reduced padding
- `px-4 py-6 md:px-6 md:py-12 lg:px-16`

### Page-Level Changes
- Dashboard overview: stats cards `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Project/contract lists: card grids responsive
- Contract detail pages: components already full-width, just verify spacing

### Files
- Modify: `src/app/[locale]/dashboard/client/layout.tsx` — padding, sidebar visibility
- Modify: `src/app/[locale]/dashboard/developer/layout.tsx` — padding, sidebar visibility
- Modify: `src/app/[locale]/dashboard/client/page.tsx` — stats grid
- Modify: `src/app/[locale]/dashboard/developer/page.tsx` — stats grid
- Modify: `src/app/[locale]/dashboard/client/projects/page.tsx` — card grid
- Modify: `src/app/[locale]/dashboard/developer/projects/page.tsx` — card grid

## 5. Chat Pages

### Current State
Chat sidebar already has mobile overlay pattern (`hidden lg:flex` + mobile overlay with backdrop). Good foundation.

### Changes
- Mobile: default shows conversation list (full screen). Tapping a conversation navigates to `chat/[conversationId]` which shows chat area full screen.
- Chat area on mobile gets a "Back" button at top-left that navigates back to `/chat`
- Determined by URL: has `conversationId` → show chat; no `conversationId` → show list
- Desktop: no change, keeps side-by-side layout

### Files
- Modify: `src/app/[locale]/chat/layout.tsx` — mobile conditional rendering
- Modify: `src/components/chat/chat-sidebar-client.tsx` — mobile full-screen mode
- Modify: `src/app/[locale]/chat/[conversationId]/page.tsx` — back button on mobile

## Breakpoint Strategy

Consistent across all components:
- `< md` (< 768px): Mobile — single column, hamburger nav, stacked layouts
- `md` - `lg` (768px - 1024px): Tablet — two columns, nav links visible, sidebars may hide
- `>= lg` (1024px+): Desktop — full layout, sidebars visible, multi-column grids

## i18n

No new translation keys needed. Mobile adaptation is pure layout/CSS.

## Security

No security implications. Pure presentational changes.
