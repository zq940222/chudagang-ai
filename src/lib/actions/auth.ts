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
    console.log("DEBUG: Registration action started for:", data.email);
    
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      console.error("DEBUG: Validation failed", parsed.error.format());
      return { error: "Invalid input" };
    }
    console.log("DEBUG: Validation passed");

    const { email, name, password, role } = parsed.data;

    console.log("DEBUG: Checking if user exists in DB...");
    const existing = await db.user.findUnique({ where: { email } }).catch(err => {
      console.error("DEBUG: DB findUnique Error:", err);
      throw err;
    });
    
    if (existing) {
      console.warn("DEBUG: User already exists");
      return { error: "Email exists" };
    }
    console.log("DEBUG: User does not exist, proceeding to hash password");

    console.log("DEBUG: Starting bcrypt hashing...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("DEBUG: Password hashed successfully");

    console.log("DEBUG: Attempting to create user in DB...");
    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: role as UserRole,
      },
    }).catch(err => {
      console.error("DEBUG: DB create Error:", err);
      throw err;
    });

    console.log("DEBUG: User created successfully ID:", user.id);
    return { success: true, id: user.id };
  } catch (error) {
    console.error("DEBUG: Final Catch - Registration error:", error);
    // Return more descriptive error for debugging (will revert later)
    return { error: error instanceof Error ? error.message : "Internal error" };
  }
}
