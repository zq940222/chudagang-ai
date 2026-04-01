import { z } from "zod";

export const projectCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  budget: z.coerce.number().min(0).optional(),
  currency: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((value) => value.toUpperCase())
    .default("CNY"),
  category: z.string().max(100).optional(),
  skillTagIds: z.array(z.string()).min(1, "Select at least one skill"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const projectUpdateSchema = projectCreateSchema.partial();
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
