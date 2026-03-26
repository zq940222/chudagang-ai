import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // Log detailed connection info (excluding password)
  try {
    if (connectionString) {
      const url = new URL(connectionString);
      console.log(`DEBUG: DB Attempting connection to: ${url.hostname} on port ${url.port}`);
      console.log(`DEBUG: Username used: ${url.username}`);
      
      if (url.port === "6543" && !url.username.includes(".")) {
        console.warn("DEBUG: WARNING - Connection pooler (6543) usually requires username format 'postgres.[project-id]'");
      }
      
      if (url.hostname.startsWith("db.") && url.port === "6543") {
        console.warn("DEBUG: WARNING - Hostnames starting with 'db.' are usually for direct connection (5432). Pooler host usually looks like 'xxx.pooler.supabase.com'");
      }
    }
  } catch {}

  const pool = new pg.Pool({ 
    connectionString,
    max: 1, 
    connectionTimeoutMillis: 10000, // Increase to 10s
    ssl: {
      rejectUnauthorized: false
    }
  });

  pool.on("error", (err) => {
    console.error("DEBUG: Pool Error:", err);
  });

  // @ts-expect-error -- pg types mismatch
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
