FROM node:22-alpine AS base

# ── deps: install all dependencies ──────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# ── builder: compile the Next.js app ────────────────────────────────────────
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── runner: minimal production image ────────────────────────────────────────
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

# standalone output + generated prisma client
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Migration tooling: full node_modules from deps stage in a separate path
COPY --from=deps --chown=nextjs:nodejs /app/node_modules /prisma_deps/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma /prisma_deps/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts /prisma_deps/prisma.config.ts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations with full deps, then start the server
CMD ["sh", "-c", "cd /prisma_deps && node node_modules/prisma/build/index.js migrate deploy && cd /app && node server.js"]
