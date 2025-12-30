// app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { venueSubmissionSchema } from "@/lib/validators/venueSubmission";

const SubmissionSchema = z.object({
  type: z.enum(["NEW_VENUE", "EDIT_VENUE"]).default("NEW_VENUE"),
  venueId: z.string().optional(),
  proposedName: z.string().min(2).max(120).optional(),
  submittedBy: z.string().optional(),
  payload: z.unknown(),
});

type FieldErrors = Record<string, string[]>;

function zodIssuesToFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    out[key] = out[key] ?? [];
    out[key].push(issue.message);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = SubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          issues: {
            formErrors: [],
            fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
          },
        },
        { status: 400 }
      );
    }

    const { type, venueId, proposedName, submittedBy, payload } = parsed.data;

    if (type === "NEW_VENUE" && !proposedName) {
      return NextResponse.json(
        {
          error: "Please enter a venue name.",
          issues: {
            formErrors: [],
            fieldErrors: { proposedName: ["Venue name is required."] },
          },
        },
        { status: 400 }
      );
    }

    if (type === "EDIT_VENUE" && !venueId) {
      return NextResponse.json(
        {
          error: "Missing venueId for edit.",
          issues: {
            formErrors: [],
            fieldErrors: { venueId: ["venueId is required for EDIT_VENUE."] },
          },
        },
        { status: 400 }
      );
    }

    // Validate payload (merge proposedName into payload to keep one schema)
    const payloadParsed = venueSubmissionSchema.safeParse({
      ...(payload as any),
      proposedName: proposedName ?? (payload as any)?.proposedName,
    });

    if (!payloadParsed.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          issues: {
            formErrors: [],
            fieldErrors: zodIssuesToFieldErrors(payloadParsed.error.issues),
          },
        },
        { status: 400 }
      );
    }

    const created = await prisma.venueSubmission.create({
      data: {
        type,
        venueId,
        proposedName: payloadParsed.data.proposedName,
        submittedBy,
        payload: payloadParsed.data,
        status: "PENDING",
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, submission: created });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
