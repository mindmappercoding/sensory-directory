// app/api/venues/[id]/reviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators/review";
import { z } from "zod";
import { auth } from "@/lib/auth";

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

class AlreadyReviewedError extends Error {
  constructor() {
    super("You’ve already reviewed this venue.");
    this.name = "AlreadyReviewedError";
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ✅ must be logged in
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in to leave a review." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Force venueId from URL (ignore any authorId/name from client)
    const parsed = reviewSchema.safeParse({ ...body, venueId: id });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          issues: {
            formErrors: [],
            fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
          },
        },
        { status: 400 }
      );
    }

    // Guard: venue must exist and be public (not archived)
    const venue = await prisma.venue.findFirst({
      where: {
        id,
        OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
      },
      select: { id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    const input = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      // ✅ Hard guard: one review per (venueId, authorId)
      const existing = await tx.review.findFirst({
        where: { venueId: venue.id, authorId: userId },
        select: { id: true },
      });

      if (existing) {
        throw new AlreadyReviewedError();
      }

      const review = await tx.review.create({
        data: {
          venueId: venue.id,
          authorId: userId,
          authorName: session?.user?.name ?? session?.user?.email ?? null,

          rating: input.rating,
          title: input.title || null,
          content: input.content || null,
          visitTimeHint: input.visitTimeHint || null,

          noiseLevel: input.noiseLevel || null,
          lighting: input.lighting || null,
          crowding: input.crowding || null,
          quietSpace:
            typeof input.quietSpace === "boolean" ? input.quietSpace : null,
          sensoryHours:
            typeof input.sensoryHours === "boolean" ? input.sensoryHours : null,
        },
        select: { id: true, createdAt: true },
      });

      await tx.venue.update({
        where: { id: venue.id },
        data: {
          reviewCount: { increment: 1 },
          lastReviewedAt: new Date(),
        },
      });

      return review;
    });

    return NextResponse.json({ ok: true, review: created });
  } catch (e: any) {
    // ✅ Our explicit guard
    if (e?.name === "AlreadyReviewedError") {
      return NextResponse.json(
        { error: "You’ve already reviewed this venue." },
        { status: 409 }
      );
    }

    // ✅ Prisma unique constraint (race-condition safety)
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "You’ve already reviewed this venue." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
