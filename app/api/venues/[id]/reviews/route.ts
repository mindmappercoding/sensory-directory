// app/api/venues/[id]/reviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators/review";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recomputeVenueReviewStats } from "@/lib/review-stats";

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

// ✅ GET: return *my* review for this venue (or null)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return NextResponse.json({ review: null });

  const review = await prisma.review.findFirst({
    where: { venueId: id, authorId: userId },
    select: {
      id: true,
      authorName: true,
      rating: true,
      title: true,
      content: true,
      visitTimeHint: true,
      noiseLevel: true,
      lighting: true,
      crowding: true,
      quietSpace: true,
      sensoryHours: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ review });
}

// ✅ POST: create *my* review
// If they already reviewed, returns 409 so UI can switch to "Edit review"
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
            typeof input.sensoryHours === "boolean"
              ? input.sensoryHours
              : null,
        },
        select: { id: true, createdAt: true },
      });

      // Recompute stored stats on Venue
      const stats = await recomputeVenueReviewStats(tx as any, venue.id);

      return { review, stats };
    });

    return NextResponse.json({ ok: true, ...created });
  } catch (e: any) {
    // Prisma unique constraint: already reviewed (venueId + authorId)
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

// ✅ PATCH: edit *my* existing review
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in to edit your review." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

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

    const updated = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: {
          // one review per user per venue
          venueId_authorId: { venueId: venue.id, authorId: userId },
        },
        data: {
          authorName:
            (session?.user?.name ??
              session?.user?.email ??
              input.authorName) || null,

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
            typeof input.sensoryHours === "boolean"
              ? input.sensoryHours
              : null,
        },
        select: { id: true, createdAt: true },
      });

      // Recompute stored stats (rating might have changed)
      const stats = await recomputeVenueReviewStats(tx as any, venue.id);

      return { review, stats };
    });

    return NextResponse.json({ ok: true, ...updated });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json(
        { error: "No existing review to edit yet." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
