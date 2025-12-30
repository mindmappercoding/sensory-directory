// lib/validators/review.ts
import { z } from "zod";

export const reviewSchema = z.object({
  venueId: z.string().min(1),

  // who (optional for now)
  authorName: z.string().max(60).optional(),
  authorId: z.string().max(120).optional(),

  // required
  rating: z.coerce.number().int().min(1, "Pick a rating 1–5.").max(5, "Pick a rating 1–5."),

  // optional text
  title: z.string().max(80, "Title must be 80 characters or less.").optional(),
  content: z.string().max(1200, "Review must be 1200 characters or less.").optional(),
  visitTimeHint: z.string().max(80, "Visit time must be 80 characters or less.").optional(),

  // sensory signals (optional)
  noiseLevel: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).optional(),
  lighting: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).optional(),
  crowding: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).optional(),
  quietSpace: z.boolean().optional(),
  sensoryHours: z.boolean().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
