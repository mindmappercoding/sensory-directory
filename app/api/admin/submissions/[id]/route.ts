// app/api/admin/submissions/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { venueSubmissionSchema } from "@/lib/validators/venueSubmission";

export const runtime = "nodejs";

const BodySchema = z.object({
  proposedName: z.string().min(2).max(120).optional(),
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.venueSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot edit submission in status ${submission.status}` },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          issues: { fieldErrors: zodIssuesToFieldErrors(parsedBody.error.issues) },
        },
        { status: 400 }
      );
    }

    const { proposedName, payload } = parsedBody.data;

    // Validate full payload against canonical schema
    const payloadParsed = venueSubmissionSchema.safeParse({
      ...(payload as any),
      proposedName: proposedName ?? (payload as any)?.proposedName,
    });

    if (!payloadParsed.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          issues: { fieldErrors: zodIssuesToFieldErrors(payloadParsed.error.issues) },
        },
        { status: 400 }
      );
    }

    await prisma.venueSubmission.update({
      where: { id },
      data: {
        proposedName: payloadParsed.data.proposedName,
        payload: payloadParsed.data,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
