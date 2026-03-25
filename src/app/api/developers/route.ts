import { NextRequest, NextResponse } from "next/server";
import { searchDevelopers } from "@/lib/services/matching";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const result = await searchDevelopers({
    query: searchParams.get("query") || undefined,
    skills: searchParams.get("skills")?.split(",").filter(Boolean) || undefined,
    minRate: searchParams.get("minRate") ? Number(searchParams.get("minRate")) : undefined,
    maxRate: searchParams.get("maxRate") ? Number(searchParams.get("maxRate")) : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
  });
  return NextResponse.json(result);
}
