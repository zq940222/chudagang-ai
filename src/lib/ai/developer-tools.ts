import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { reviewDeveloperProfile } from "@/lib/services/developer-review";
import { presentOptions, presentForm, resolveSkills } from "@/lib/ai/tools";

export const extractDeveloperProfile = tool({
  description:
    "Extract structured developer profile data from the conversation. Call this when the user has described their background and skills.",
  inputSchema: z.object({
    displayName: z.string().describe("Display name (2-100 chars)"),
    title: z.string().optional().describe("Job title, e.g. 'Full-Stack Developer'"),
    bio: z.string().optional().describe("Professional bio (max 2000 chars)"),
    skills: z.array(z.string()).describe("List of skill/technology names"),
    hourlyRate: z.number().optional().describe("Hourly rate"),
    currency: z.string().optional().default("CNY").describe("Currency: CNY, USD, EUR"),
    githubUrl: z.string().optional().describe("GitHub profile URL"),
    portfolioUrl: z.string().optional().describe("Portfolio URL"),
  }),
  execute: async ({ displayName, title, bio, skills, hourlyRate, currency, githubUrl, portfolioUrl }) => {
    return {
      displayName,
      title: title ?? null,
      bio: bio ?? null,
      skills,
      hourlyRate: hourlyRate ?? null,
      currency: currency ?? "CNY",
      githubUrl: githubUrl ?? null,
      portfolioUrl: portfolioUrl ?? null,
      extractedAt: new Date().toISOString(),
    };
  },
});

export const createDeveloperProfile = tool({
  description:
    "Create a developer profile from extracted data. Call after user confirms their profile information.",
  inputSchema: z.object({
    displayName: z.string(),
    title: z.string().optional(),
    bio: z.string().optional(),
    skillTagIds: z.array(z.string()).describe("IDs of resolved skills"),
    hourlyRate: z.number().optional(),
    currency: z.string().optional().default("CNY"),
    githubUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
    userId: z.string().describe("The authenticated user's ID"),
  }),
  execute: async ({ displayName, title, bio, skillTagIds, hourlyRate, currency, githubUrl, portfolioUrl, userId }) => {
    // Check if profile already exists
    const existing = await db.developerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      return { error: "Developer profile already exists", profileId: existing.id };
    }

    const profile = await db.developerProfile.create({
      data: {
        displayName,
        title: title ?? null,
        bio: bio ?? null,
        hourlyRate: hourlyRate ?? null,
        currency: currency ?? "CNY",
        githubUrl: githubUrl ?? null,
        portfolioUrl: portfolioUrl ?? null,
        userId,
        status: "PENDING_REVIEW",
        skills: {
          create: skillTagIds.map((skillTagId) => ({ skillTagId })),
        },
      },
      include: {
        skills: { include: { skillTag: true } },
      },
    });

    // Update user role to DEVELOPER
    await db.user.update({
      where: { id: userId },
      data: { role: "DEVELOPER" },
    });

    // Trigger AI review in background
    reviewDeveloperProfile(profile.id).catch(console.error);

    return {
      profileId: profile.id,
      displayName: profile.displayName,
      status: profile.status,
    };
  },
});

export const developerTools = {
  extractDeveloperProfile,
  resolveSkills,
  createDeveloperProfile,
  presentOptions,
  presentForm,
};
