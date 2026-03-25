import type { Project, SkillTag, User } from "@prisma/client";

export type ProjectWithDetails = Project & {
  client: Pick<User, "id" | "name" | "avatar">;
  skills: { skillTag: SkillTag }[];
  _count?: { applications: number };
};

export type ProjectCardData = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  currency: string;
  category: string | null;
  status: string;
  skills: { id: string; name: string; localeZh: string; localeEn: string }[];
  clientName: string | null;
  applicationCount: number;
  createdAt: string;
};

export type ProjectSearchParams = {
  query?: string;
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  page?: number;
  limit?: number;
};
