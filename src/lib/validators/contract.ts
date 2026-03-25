import { z } from "zod";

export const createContractSchema = z.object({
  projectId: z.string().min(1),
  developerId: z.string().min(1),
  title: z.string().min(3).max(200),
  terms: z.record(z.string(), z.unknown()),
  totalAmount: z.number().min(1),
  currency: z.enum(["USD", "CNY", "EUR"]).default("USD"),
});

export const signContractSchema = z.object({
  contractId: z.string().min(1),
});
