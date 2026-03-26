import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local (Next.js convention) then .env as fallback
dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
    // @ts-expect-error -- directUrl is supported by Prisma 7 CLI but missing from current @prisma/config types
    directUrl: env("DIRECT_URL"),
  },
});
