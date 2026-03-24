import { describe, it, expect } from "vitest";

describe("Database", () => {
  it("prisma client module exports db", async () => {
    const { db } = await import("@/lib/db");
    expect(db).toBeDefined();
    expect(typeof db.$connect).toBe("function");
  });
});
