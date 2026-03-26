import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // Log sanitized connection info for debugging
  try {
    if (connectionString) {
      const url = new URL(connectionString);
      console.log(`DEBUG: DB Client connecting to ${url.hostname}:${url.port}${url.pathname} (protocol: ${url.protocol})`);
      if (url.searchParams.get("pgbouncer") !== "true" && url.port === "6543") {
        console.warn("DEBUG: Warning - Using port 6543 without pgbouncer=true might cause issues with Prisma.");
      }
    } else {
      console.error("DEBUG: DATABASE_URL is missing.");
    }
  } catch {
    console.error("DEBUG: DATABASE_URL is not a valid URL.");
  }

  // Use a smaller pool size for serverless functions to avoid exhausting DB connections
  const pool = new pg.Pool({ 
    connectionString,
    max: 10, // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Wait 5s for connection before failing
  });

  pool.on("error", (err) => {
    console.error("DEBUG: Unexpected error on idle client", err);
  });

  // @ts-expect-error -- pg types mismatch between @types/pg and @prisma/adapter-pg bundled types
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
