import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeVenueReviewStats } from "@/lib/review-stats";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, venueId: true, hiddenAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const nextHiddenAt = existing.hiddenAt ? null : new Date();

    const venueStats = await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { hiddenAt: nextHiddenAt },
        select: { id: true },
      });

      // ✅ THIS is what updates Venue.visibleReviewCount/hiddenReviewCount/avgRating in Mongo
      return recomputeVenueReviewStats(tx as any, existing.venueId);
    });

    return NextResponse.json({
      ok: true,
      hidden: !!nextHiddenAt,
      venue: venueStats,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, venueId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const venueStats = await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });

      // ✅ recompute + persist stored stats
      return recomputeVenueReviewStats(tx as any, existing.venueId);
    });

    return NextResponse.json({ ok: true, venue: venueStats });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
