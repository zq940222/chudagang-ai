import { tool } from "ai";
import { z } from "zod";
import { searchDevelopers } from "@/lib/services/matching";
import { createProjectFromAI } from "@/lib/actions/project";
import { db } from "@/lib/db";

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
      .describe("Estimated budget in CNY, if mentioned"),
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

export const resolveSkills = tool({
  description: "Resolve skill names to internal IDs. Use this before creating a project draft.",
  inputSchema: z.object({
    skills: z.array(z.string()).describe("Skill names to resolve"),
  }),
  execute: async ({ skills }) => {
    const tags = await db.skillTag.findMany({
      where: {
        name: { in: skills, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });
    return { tags };
  },
});

export const createProjectDraft = tool({
  description: "Create a project draft from the extracted requirements. Call this when the user confirms they want to proceed with creating a project.",
  inputSchema: z.object({
    title: z.string(),
    description: z.string(),
    budget: z.number().optional(),
    currency: z.string().default("CNY"),
    skillTagIds: z.array(z.string()).describe("IDs of the resolved skills"),
    conversationId: z.string().optional(),
  }),
  execute: async (params) => {
    const result = await createProjectFromAI(params);
    if (result.error) throw new Error(result.error);
    return { project: result.data };
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
    minRate: z.number().optional().describe("Minimum hourly rate in CNY"),
    maxRate: z.number().optional().describe("Maximum hourly rate in CNY"),
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
      currency: "CNY",
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

export const presentOptions = tool({
  description:
    "Present clickable options for the user to choose from. Use this when asking a question with a finite set of answers (e.g. project type, budget range, timeline). The user can click an option instead of typing.",
  inputSchema: z.object({
    question: z.string().describe("The question to ask the user"),
    options: z
      .array(
        z.object({
          label: z.string().describe("Display label for the option"),
          value: z.string().describe("Value to send back when selected"),
          description: z
            .string()
            .optional()
            .describe("Optional short description under the label"),
          icon: z
            .enum(["mobile", "web", "ai", "api", "database", "cloud", "design", "other"])
            .optional()
            .describe("Optional icon hint"),
        })
      )
      .min(2)
      .max(8)
      .describe("List of options to present"),
    allowMultiple: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether the user can select multiple options"),
  }),
  execute: async ({ question, options, allowMultiple }) => {
    return { question, options, allowMultiple: allowMultiple ?? false };
  },
});

export const presentForm = tool({
  description:
    "Present a short inline form for the user to fill in structured data. Use this when you need several pieces of information at once (e.g. project name + budget + timeline). Keep forms short (2-5 fields).",
  inputSchema: z.object({
    title: z.string().describe("Form title / heading"),
    fields: z
      .array(
        z.object({
          name: z.string().describe("Field key name"),
          label: z.string().describe("Display label"),
          type: z
            .enum(["text", "number", "select", "textarea"])
            .describe("Input type"),
          placeholder: z.string().optional().describe("Placeholder text"),
          options: z
            .array(z.object({ label: z.string(), value: z.string() }))
            .optional()
            .describe("Options for select type fields"),
          required: z.boolean().optional().default(true),
        })
      )
      .min(1)
      .max(5)
      .describe("Form fields to display"),
    submitLabel: z.string().optional().default("Submit").describe("Submit button text"),
  }),
  execute: async ({ title, fields, submitLabel }) => {
    return { title, fields, submitLabel: submitLabel ?? "Submit" };
  },
});

export const aiTools = {
  extractRequirements,
  resolveSkills,
  createProjectDraft,
  searchDevelopers: searchDevelopersTool,
  estimateBudget,
  presentOptions,
  presentForm,
};
