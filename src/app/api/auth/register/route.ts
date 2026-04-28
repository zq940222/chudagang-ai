import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Registration attempt:", { ...body, password: "[REDACTED]" });
    const { email, name, password, role } = body;
    
    if (!email || !password || !name) {
      console.error("Missing fields in registration request");
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      console.warn("Registration failed: Email already exists", email);
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }
    
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const validRole: UserRole = role === "DEVELOPER" ? "DEVELOPER" : "CLIENT";
    console.log("Creating user in database...");
    const user = await db.user.create({
      data: { email, name, hashedPassword, activeRole: validRole },
    });
    
    console.log("User created successfully:", user.id);
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration internal error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
