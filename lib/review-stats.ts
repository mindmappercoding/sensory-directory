// lib/review-stats.ts
import { Prisma } from "@prisma/client";

export async function recomputeVenueReviewStats(
  tx: Prisma.TransactionClient,
  venueId: string
) {
  // ✅ Visible = hiddenAt is null (works reliably with Mongo + Prisma)
  const visibleAgg = await tx.review.aggregate({
    where: { venueId, hiddenAt: null },
    _count: { _all: true },
    _avg: { rating: true },
    _max: { createdAt: true },
  });

  // ✅ Hidden = hiddenAt is NOT null
  const hiddenCount = await tx.review.count({
    where: { venueId, hiddenAt: { not: null } },
  });

  const visibleCount = visibleAgg._count._all;
  const avgRating = visibleAgg._avg.rating ?? null;
  const lastReviewedAt = visibleAgg._max.createdAt ?? null;

  await tx.venue.update({
    where: { id: venueId },
    data: {
      // keep existing field working everywhere
      reviewCount: visibleCount,

      // stored fields
      visibleReviewCount: visibleCount,
      hiddenReviewCount: hiddenCount,
      avgRating,
      lastReviewedAt,
    },
  });

  return { visibleCount, hiddenCount, avgRating, lastReviewedAt };
}
