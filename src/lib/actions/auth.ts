"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["CLIENT", "DEVELOPER"]),
});

export async function register(data: z.infer<typeof registerSchema>) {
  try {
    console.log("Registration action called:", { ...data, password: "[REDACTED]" });
    
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Registration validation failed:", parsed.error.flatten().fieldErrors);
      return { error: "Invalid input" };
    }

    const { email, name, password, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      console.warn("Registration failed: Email already exists", email);
      return { error: "Email exists" };
    }

    console.log("Hashing password in action...");
    // Using a lower cost factor for bcrypt to avoid timeouts in serverless
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Creating user in database from action...");
    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: role as UserRole,
      },
    });

    console.log("User created successfully in action:", user.id);
    return { success: true, id: user.id };
  } catch (error) {
    console.error("Registration action internal error:", error);
    return { error: "Internal error" };
  }
}
