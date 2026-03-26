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
      const host = url.hostname.trim();
      console.log(`DEBUG: DB Host: "${host}" (Length: ${host.length})`);
      console.log(`DEBUG: DB Port: ${url.port}`);
      console.log(`DEBUG: DB User: ${url.username}`);
      
      if (host.includes("supabase.co") && !host.startsWith("db.")) {
        console.warn("DEBUG: WARNING - Supabase direct host usually starts with 'db.'");
      }
      if (url.port === "6543" && !host.includes("pooler")) {
        console.warn("DEBUG: WARNING - Port 6543 should usually be used with a '.pooler.supabase.com' host.");
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
