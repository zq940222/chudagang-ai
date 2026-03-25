import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await db.developerProfile.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, avatar: true, createdAt: true } },
      skills: { include: { skillTag: true } },
      availabilities: {
        where: { date: { gte: new Date() }, status: "AVAILABLE" },
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}
