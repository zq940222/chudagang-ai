import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";
  
  // Clean debug log to verify environment in Vercel
  try {
    if (connectionString) {
      const url = new URL(connectionString);
      console.log(`DEBUG: Prisma Engine connecting to ${url.hostname}:${url.port} (pgbouncer: ${url.searchParams.get("pgbouncer")})`);
    }
  } catch {}

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
