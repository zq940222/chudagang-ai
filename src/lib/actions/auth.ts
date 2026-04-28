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
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid input" };
    }

    const { email, name, password, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    
    if (existing) {
      return { error: "Email exists" };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword,
        activeRole: role as UserRole,
        // roles uses schema default [CLIENT, DEVELOPER]
      },
    });

    return { success: true, id: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Internal error" };
  }
}
