import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "@/lib/db";

const reviewResultSchema = z.object({
  rating: z.number().min(0).max(5).describe("Overall rating 0-5"),
  approved: z.boolean().describe("Whether developer meets minimum quality bar"),
  reasoning: z.string().describe("Brief explanation of the rating"),
  suggestions: z.array(z.string()).describe("Suggestions for improvement"),
});

export async function reviewDeveloperProfile(profileId: string) {
  const profile = await db.developerProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { name: true, email: true } },
      skills: { include: { skillTag: true } },
    },
  });

  if (!profile) throw new Error("Profile not found");

  const skillNames = profile.skills.map((s) => s.skillTag.name).join(", ");

  const { object: review } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: reviewResultSchema,
    prompt: `You are an AI developer marketplace quality reviewer. Review this developer profile and provide a rating.

Developer: ${profile.displayName}
Title: ${profile.title || "Not provided"}
Bio: ${profile.bio || "Not provided"}
Skills: ${skillNames}
GitHub: ${profile.githubUrl || "Not provided"}
Portfolio: ${profile.portfolioUrl || "Not provided"}
Hourly Rate: ${profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Not set"}

Rate 0-5 based on: profile completeness, skill relevance to AI/ML, GitHub/portfolio presence, professional presentation.
Approve if rating >= 2.5.`,
  });

  await db.developerProfile.update({
    where: { id: profileId },
    data: {
      aiRating: review.rating,
      status: review.approved ? "APPROVED" : "REJECTED",
      verifiedAt: review.approved ? new Date() : null,
    },
  });

  return review;
}
