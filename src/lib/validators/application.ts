import { z } from "zod";

export const applyToProjectSchema = z.object({
  projectId: z.string().min(1),
  coverLetter: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => v?.trim() || null),
  proposedRate: z
    .number()
    .min(0)
    .max(10000)
    .optional()
    .transform((v) => v ?? null),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED"]),
});
