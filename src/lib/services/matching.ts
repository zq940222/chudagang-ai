import { db } from "@/lib/db";
import type { DeveloperSearchParams, DeveloperCardData } from "@/types/developer";

export async function searchDevelopers(params: DeveloperSearchParams): Promise<{
  developers: DeveloperCardData[];
  total: number;
}> {
  const { query, skills, minRate, maxRate, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "APPROVED" };

  if (query) {
    where.OR = [
      { displayName: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { bio: { contains: query, mode: "insensitive" } },
    ];
  }

  if (minRate !== undefined || maxRate !== undefined) {
    where.hourlyRate = {};
    if (minRate !== undefined) (where.hourlyRate as Record<string, number>).gte = minRate;
    if (maxRate !== undefined) (where.hourlyRate as Record<string, number>).lte = maxRate;
  }

  if (skills && skills.length > 0) {
    where.skills = { some: { skillTag: { name: { in: skills } } } };
  }

  const [developers, total] = await Promise.all([
    db.developerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        skills: { include: { skillTag: true } },
      },
      orderBy: [{ aiRating: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.developerProfile.count({ where }),
  ]);

  return {
    developers: developers.map((d) => ({
      id: d.id,
      displayName: d.displayName,
      title: d.title,
      bio: d.bio,
      hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : null,
      currency: d.currency,
      aiRating: d.aiRating ? Number(d.aiRating) : null,
      status: d.status,
      avatar: d.user.avatar,
      skills: d.skills.map((s) => ({
        id: s.skillTag.id,
        name: s.skillTag.name,
        localeZh: s.skillTag.localeZh,
        localeEn: s.skillTag.localeEn,
      })),
    })),
    total,
  };
}
