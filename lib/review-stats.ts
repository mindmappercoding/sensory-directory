// lib/review-stats.ts
import { Prisma } from "@prisma/client";

export async function recomputeVenueReviewStats(
  tx: Prisma.TransactionClient,
  venueId: string
) {
  // ✅ Visible = hiddenAt is null
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

  // ✅ Total reviews should include BOTH visible + hidden (so hiding does NOT reduce reviewCount)
  const totalCount = visibleCount + hiddenCount;

  // ✅ Avg rating stays based on VISIBLE reviews only (so hiding affects avg, as expected)
  const avgRating = visibleAgg._avg.rating ?? null;

  // ✅ Last reviewed is based on latest VISIBLE review (public-facing)
  const lastReviewedAt = visibleAgg._max.createdAt ?? null;

  await tx.venue.update({
    where: { id: venueId },
    data: {
      // ✅ reviewCount = total (visible + hidden)
      reviewCount: totalCount,

      // stored breakdown + visible-only average
      visibleReviewCount: visibleCount,
      hiddenReviewCount: hiddenCount,
      avgRating,
      lastReviewedAt,
    },
  });

  return { totalCount, visibleCount, hiddenCount, avgRating, lastReviewedAt };
}
