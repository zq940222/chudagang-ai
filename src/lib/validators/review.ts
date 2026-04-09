import { z } from "zod";
import { ALL_REVIEW_TAGS } from "@/lib/review-tags";

export const submitReviewSchema = z.object({
  contractId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z
    .array(z.enum(ALL_REVIEW_TAGS))
    .min(0)
    .max(5),
  comment: z.string().max(500).optional(),
});
