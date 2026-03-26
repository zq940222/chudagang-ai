# GEMINI.md

## Project Overview

**杵大岗AI (ChuDaGang AI)** is an AI-powered marketplace connecting employers with AI developers. It replaces traditional human customer service with an AI Agent that handles the complete workflow: pre-sales consultation, project scoping, developer matching, contract generation, payment, and delivery management.

- **AI-First Experience**: AI handles requirement extraction and developer matching.
- **Zero Human Intervention**: Automated pre-sales, contracts, and payments.
- **Bilingual**: Supports Chinese (zh) and English (en) via `next-intl`.

### Core Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Supabase/Neon) |
| Auth | NextAuth.js v5 (Auth.js) |
| AI | Vercel AI SDK + OpenAI/Claude/Qwen |
| Payment | Stripe (with Escrow support) |
| i18n | next-intl |
| UI | Tailwind CSS v4 + Radix UI |
| Testing | Vitest + Testing Library |

## Building and Running

### Prerequisites

- Node.js (Latest LTS recommended)
- PostgreSQL database
- Redis (Upstash recommended for rate limiting/caching)
- Environment variables configured (see `.env.example`)

### Commands

```bash
# Install dependencies
npm install

# Database setup
npx prisma generate
npx prisma db push
npx prisma seed

# Development server
npm run dev

# Production build
npm run build
npm start

# Quality control
npm run lint
npm run typecheck
npx vitest
```

## Project Structure

- `src/app/[locale]`: App Router pages with i18n support.
- `src/components`: UI components (Radix + Tailwind).
- `src/lib/actions`: Server Actions for business logic.
- `src/lib/ai`: AI Gateway, tools, and system prompts.
- `src/lib/services`: Complex service logic (matching, payments, contracts).
- `src/i18n`: Internationalization configuration and messages.
- `prisma/`: Database schema and seed scripts.
- `docs/superpowers`: Project specifications and implementation plans.

## Development Conventions

- **Next.js 16**: Be aware of Next.js 16/React 19 conventions. Use Server Components by default.
- **I18n**: All user-facing strings must be in `src/i18n/messages/*.json` and retrieved via `useTranslations` or `getTranslations`.
- **Database**: Use the shared `db` instance from `@/lib/db`. Always update `schema.prisma` for data model changes.
- **AI**: Logic should be encapsulated in `src/lib/ai`. Use the Vercel AI SDK for streaming and tool calling.
- **Payments**: Use the `StripeService` for all payment-related logic. Webhooks must be idempotent.
- **Styling**: Follow the "Synthetic Architect" design system (Midnight Blue, Electric Cyan, Neon Violet). Avoid 1px borders; use tonal transitions.
- **Testing**: Add Vitest tests for critical service logic and server actions.

## Key Entities

- **User**: Multi-role (CLIENT, DEVELOPER, ADMIN).
- **Project**: Core unit of work, created via AI conversation or manually.
- **Conversation**: AI-driven requirement gathering and matching.
- **Contract**: Automated agreement between client and developer with escrow.
- **Payment**: Managed through Stripe with HELD (Escrow) and RELEASED states.
