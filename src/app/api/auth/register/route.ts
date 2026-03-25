import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, name, password, role } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const validRole: UserRole = role === "DEVELOPER" ? "DEVELOPER" : "CLIENT";
    const user = await db.user.create({
      data: { email, name, hashedPassword, role: validRole },
    });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
