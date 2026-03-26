import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // Use pool for Serverless
  const pool = new pg.Pool({ 
    connectionString,
    max: 1, // Minimize connections in serverless
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Log sanitized connection info for debugging
  try {
    if (connectionString) {
      const url = new URL(connectionString);
      console.log(`DEBUG: DB Client connecting to ${url.hostname}:${url.port} (protocol: ${url.protocol}, pgbouncer: ${url.searchParams.get("pgbouncer")})`);
    }
  } catch {}

  // @ts-expect-error -- pg types mismatch
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
