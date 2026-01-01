import { z } from "zod";

export const reviewReportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "HATE",
    "OFF_TOPIC",
    "MISINFORMATION",
    "PRIVACY",
    "OTHER",
  ]),
  message: z
    .string()
    .max(500, "Message must be 500 characters or less.")
    .optional(),
});

export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
