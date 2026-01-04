// app/api/venues/[id]/reviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators/review";
import { z } from "zod";
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

function pickAuthorName(inputName: unknown, sessionName?: string | null, sessionEmail?: string | null) {
  const typed =
    typeof inputName === "string" && inputName.trim().length > 0
      ? inputName.trim()
      : null;

  return typed ?? sessionName ?? sessionEmail ?? null;
}

// ✅ GET: return *my* review for this venue (or null)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

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

  return NextResponse.json({ review: review ?? null });
}

// ✅ POST: create my review + recompute Venue stats
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in to leave a review." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Force venueId from URL
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

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          venueId: venue.id,
          authorId: userId,

          // ✅ allow overwrite; else default to Google name/email
          authorName: pickAuthorName(input.authorName, session?.user?.name ?? null, session?.user?.email ?? null),

          rating: input.rating,
          title: input.title || null,
          content: input.content || null,
          visitTimeHint: input.visitTimeHint || null,

          noiseLevel: input.noiseLevel || null,
          lighting: input.lighting || null,
          crowding: input.crowding || null,
          quietSpace: typeof input.quietSpace === "boolean" ? input.quietSpace : null,
          sensoryHours: typeof input.sensoryHours === "boolean" ? input.sensoryHours : null,

          hiddenAt: null,
        },
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

      const stats = await recomputeVenueReviewStats(tx as any, venue.id);
      return { review, stats };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
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

// ✅ PATCH: edit my existing review + recompute Venue stats
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

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

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: {
          venueId_authorId: { venueId: venue.id, authorId: userId },
        },
        data: {
          // ✅ allow overwrite; else default to Google name/email
          authorName: pickAuthorName(input.authorName, session?.user?.name ?? null, session?.user?.email ?? null),

          rating: input.rating,
          title: input.title || null,
          content: input.content || null,
          visitTimeHint: input.visitTimeHint || null,

          noiseLevel: input.noiseLevel || null,
          lighting: input.lighting || null,
          crowding: input.crowding || null,
          quietSpace: typeof input.quietSpace === "boolean" ? input.quietSpace : null,
          sensoryHours: typeof input.sensoryHours === "boolean" ? input.sensoryHours : null,
        },
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

      const stats = await recomputeVenueReviewStats(tx as any, venue.id);
      return { review, stats };
    });

    return NextResponse.json({ ok: true, ...result });
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
