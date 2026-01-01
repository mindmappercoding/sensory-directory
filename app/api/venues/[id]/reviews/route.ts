import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeVenueReviewStats } from "@/lib/review-stats";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const hidden = !!body?.hidden;

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, venueId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { hiddenAt: hidden ? new Date() : null },
        select: { id: true },
      });

      const stats = await recomputeVenueReviewStats(tx as any, existing.venueId);
      return stats;
    });

    return NextResponse.json({ ok: true, stats: result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
