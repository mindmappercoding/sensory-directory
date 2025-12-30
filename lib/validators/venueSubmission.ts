import { z } from "zod";

export const SensoryLevelEnum = z.enum([
  "VERY_LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
]);

export const venueSubmissionSchema = z.object({
  proposedName: z.string().min(2, "Venue name must be at least 2 characters."),

  description: z.string().max(800).optional(),

  website: z
    .union([
      z.literal(""),
      z.string().url("Website must be a valid URL (e.g. https://example.com)."),
    ])
    .optional(),

  phone: z.string().max(30).optional(),

  address1: z.string().optional(),
  address2: z.string().optional(),

  city: z.string().min(2, "City is required."),
  postcode: z.string().min(3, "Postcode is required."),
  county: z.string().optional(),

  tags: z.array(z.string()).min(1, "Pick at least 1 tag."),

  sensory: z
    .object({
      noiseLevel: SensoryLevelEnum.optional(),
      lighting: SensoryLevelEnum.optional(),
      crowding: SensoryLevelEnum.optional(),
      quietSpace: z.boolean().optional(),
      sensoryHours: z.boolean().optional(),
      notes: z.string().max(600).optional(),
    })
    .optional(),

  facilities: z
    .object({
      parking: z.boolean().optional(),
      accessibleToilet: z.boolean().optional(),
      babyChange: z.boolean().optional(),
      wheelchairAccess: z.boolean().optional(),
      staffTrained: z.boolean().optional(),
      notes: z.string().max(600).optional(),
    })
    .optional(),
});

export type VenueSubmissionInput = z.infer<typeof venueSubmissionSchema>;
