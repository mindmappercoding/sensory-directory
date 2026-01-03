import { z } from "zod";

export const SensoryLevelEnum = z.enum(
  ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
  { message: "This field is required." }
);

// UK postcode (common practical regex, allows optional space, handles formats like EC1A 1BB, W1A 0AX, M1 1AE)
const UK_POSTCODE_REGEX =
  /^(GIR\s?0AA|(?:[A-Z]{1,2}\d{1,2}[A-Z]?)\s?\d[A-Z]{2})$/i;

export const venueSubmissionSchema = z.object({
  proposedName: z
    .string()
    .trim()
    .min(2, "Venue name must be at least 2 characters.")
    .max(120, "Venue name is too long."),

  // ✅ NOW REQUIRED
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(800, "Description is too long."),

  // ✅ NOW REQUIRED (must be a URL)
  website: z
    .string()
    .trim()
    .url("Website must be a valid URL (e.g. https://example.com)."),

  // ✅ NOW REQUIRED (digits only)
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required.")
    .max(30, "Phone number is too long.")
    .regex(/^\d+$/, "Phone number must contain numbers only (digits)."),

  // ✅ NOW REQUIRED
  address1: z.string().trim().min(1, "Address line 1 is required."),
  address2: z.string().trim().min(1, "Address line 2 is required."),

  // ✅ NOW REQUIRED
  city: z.string().trim().min(2, "City is required."),
  postcode: z
    .string()
    .trim()
    .min(1, "Postcode is required.")
    .regex(UK_POSTCODE_REGEX, "Postcode must be a valid UK postcode."),
  county: z.string().trim().min(1, "County is required."),

  // ✅ tags: minimum 1 required (already correct)
  tags: z.array(z.string()).min(1, "Pick at least 1 tag."),

  // ✅ images NOW REQUIRED
  coverImageUrl: z.string().trim().url("Cover image must be a valid URL."),
  imageUrls: z
    .array(z.string().trim().url("Each gallery image must be a valid URL."))
    .min(1, "Upload at least 1 gallery image.")
    .max(10, "You can upload up to 10 gallery images."),

  // ✅ sensory NOW REQUIRED (notes optional)
  sensory: z.object({
    noiseLevel: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"], {
      message: "Noise level is required.",
    }),
    lighting: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"], {
      message: "Lighting is required.",
    }),
    crowding: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"], {
      message: "Crowding is required.",
    }),

    // required booleans (we’ll default them to false in the form)
    quietSpace: z.boolean({
      message: "Please choose whether a quiet space is available.",
    }),
    sensoryHours: z.boolean({
      message: "Please choose whether sensory hours are offered.",
    }),

    // ✅ notes optional
    notes: z.string().max(600).optional(),
  }),

  // ✅ facilities optional (and notes optional)
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
