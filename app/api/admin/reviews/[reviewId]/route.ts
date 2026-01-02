// app/api/admin/reviews/[reviewId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeVenueReviewStats } from "@/lib/review-stats";

// ✅ HIDE / UNHIDE (leave this as you had it if it's working)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const body = (await req.json().catch(() => null)) as
      | { hidden?: boolean }
      | null;

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, venueId: true, hiddenAt: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    // If body.hidden provided, respect it; otherwise toggle
    let nextHiddenAt: Date | null;
    if (body && typeof body.hidden === "boolean") {
      nextHiddenAt = body.hidden ? new Date() : null;
    } else {
      nextHiddenAt = existing.hiddenAt ? null : new Date();
    }

    const venueStats = await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { hiddenAt: nextHiddenAt },
        select: { id: true },
      });

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

// ✅ DELETE = delete review + its reports + recompute stats
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
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    const venueStats = await prisma.$transaction(async (tx) => {
      // 🔑 delete all reports linked to this review first
      await tx.reviewReport.deleteMany({
        where: { reviewId },
      });

      // then delete the review itself
      await tx.review.delete({
        where: { id: reviewId },
      });

      // recompute venue stats
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
