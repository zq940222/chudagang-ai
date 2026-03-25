import { tool } from "ai";
import { z } from "zod";
import { searchDevelopers } from "@/lib/services/matching";

export const extractRequirements = tool({
  description:
    "Extract structured project requirements from the conversation. Call this when the user has described what they need built.",
  inputSchema: z.object({
    title: z.string().describe("Short project title (5-80 chars)"),
    description: z
      .string()
      .describe("Detailed project description (20-5000 chars)"),
    skills: z
      .array(z.string())
      .describe("List of required skill/technology names, e.g. ['React', 'Node.js']"),
    budget: z
      .number()
      .optional()
      .describe("Estimated budget in USD, if mentioned"),
    timeline: z
      .string()
      .optional()
      .describe("Estimated timeline, e.g. '2-4 weeks'"),
  }),
  execute: async ({ title, description, skills, budget, timeline }) => {
    return {
      title,
      description,
      skills,
      budget: budget ?? null,
      timeline: timeline ?? null,
      extractedAt: new Date().toISOString(),
    };
  },
});

export const searchDevelopersTool = tool({
  description:
    "Search for developers matching project requirements. Use after extracting requirements to find suitable candidates.",
  inputSchema: z.object({
    query: z.string().optional().describe("Free-text search query"),
    skills: z
      .array(z.string())
      .optional()
      .describe("Skill names to filter by"),
    minRate: z.number().optional().describe("Minimum hourly rate in USD"),
    maxRate: z.number().optional().describe("Maximum hourly rate in USD"),
    page: z.number().optional().describe("Page number, defaults to 1"),
    limit: z.number().optional().describe("Results per page, defaults to 5"),
  }),
  execute: async (params) => {
    const result = await searchDevelopers({
      ...params,
      limit: params.limit ?? 5,
    });
    return {
      developers: result.developers,
      total: result.total,
    };
  },
});

export const estimateBudget = tool({
  description:
    "Estimate a budget range for a project based on complexity, required skills, and timeline.",
  inputSchema: z.object({
    complexity: z
      .enum(["low", "medium", "high"])
      .describe("Project complexity level"),
    skills: z
      .array(z.string())
      .describe("Required skills/technologies"),
    timelineWeeks: z
      .number()
      .describe("Estimated timeline in weeks"),
    description: z
      .string()
      .optional()
      .describe("Brief project description for context"),
  }),
  execute: async ({ complexity, skills, timelineWeeks }) => {
    // Base hourly rates by complexity
    const baseRates: Record<string, { low: number; high: number }> = {
      low: { low: 30, high: 60 },
      medium: { low: 60, high: 120 },
      high: { low: 100, high: 200 },
    };

    const rate = baseRates[complexity];
    const hoursPerWeek = 30;

    // Skill multiplier: more skills = higher cost
    const skillMultiplier = 1 + Math.min(skills.length * 0.05, 0.3);

    const totalHours = timelineWeeks * hoursPerWeek;
    const low = Math.round(totalHours * rate.low * skillMultiplier);
    const high = Math.round(totalHours * rate.high * skillMultiplier);

    return {
      currency: "USD",
      low,
      high,
      hoursEstimate: totalHours,
      rateRange: {
        low: Math.round(rate.low * skillMultiplier),
        high: Math.round(rate.high * skillMultiplier),
      },
      breakdown: {
        complexity,
        skillCount: skills.length,
        skillMultiplier: Number(skillMultiplier.toFixed(2)),
        timelineWeeks,
        hoursPerWeek,
      },
    };
  },
});

export const aiTools = {
  extractRequirements,
  searchDevelopers: searchDevelopersTool,
  estimateBudget,
};
