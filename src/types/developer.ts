import type { DeveloperProfile, SkillTag, Availability, User } from "@prisma/client";

export type DeveloperWithSkills = DeveloperProfile & {
  user: Pick<User, "id" | "name" | "email" | "avatar">;
  skills: { skillTag: SkillTag }[];
  availabilities?: Availability[];
};

export type DeveloperCardData = {
  id: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  currency: string;
  aiRating: number | null;
  status: string;
  avatar: string | null;
  skills: { id: string; name: string; localeZh: string; localeEn: string }[];
};

export type DeveloperSearchParams = {
  query?: string;
  skills?: string[];
  category?: string;
  minRate?: number;
  maxRate?: number;
  available?: boolean;
  page?: number;
  limit?: number;
};
