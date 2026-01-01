import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const result = await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });

      const agg = await tx.review.aggregate({
        where: { venueId: existing.venueId },
        _count: { _all: true },
        _max: { createdAt: true },
      });

      await tx.venue.update({
        where: { id: existing.venueId },
        data: {
          reviewCount: agg._count._all,
          lastReviewedAt: agg._max.createdAt ?? null,
        },
      });

      return {
        reviewCount: agg._count._all,
        lastReviewedAt: agg._max.createdAt ?? null,
      };
    });

    return NextResponse.json({ ok: true, venue: result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
