import { z } from "zod";

export const profileCreateSchema = z.object({
  displayName: z.string().min(2).max(100),
  title: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).max(1000).optional(),
  currency: z.enum(["USD", "CNY", "EUR"]).default("CNY"),
  skillTagIds: z.array(z.string()).min(1, "Select at least one skill"),
});

export const profileUpdateSchema = profileCreateSchema.partial();

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["AVAILABLE", "BUSY", "TENTATIVE", "BLOCKED"]).default("AVAILABLE"),
  note: z.string().max(500).optional(),
});

export const availabilityBatchSchema = z.object({
  slots: z.array(availabilitySchema).min(1),
});

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
