// lib/venues.ts
import { prisma } from "@/lib/prisma";

export type Filters = {
  q?: string;
  city?: string;
  tags?: string[];
  sensoryHours?: "true" | "false";
  quietSpace?: "true" | "false";

  noiseLevel?: string;
  lighting?: string;
  crowding?: string;

  sort?: "newest" | "recentlyReviewed" | "highestRated" | "mostReviewed" | "";
};

function normalizeTag(t: string) {
  return t.toLowerCase().trim();
}

export async function listVenues(filters: Filters) {
  const and: any[] = [];

  // ✅ Always exclude archived venues
  and.push({
    OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
  });

  if (filters.city?.trim()) {
    // more forgiving than equals()
    and.push({
      city: { contains: filters.city.trim(), mode: "insensitive" },
    });
  }

  if (filters.tags?.length) {
    const tags = filters.tags.map(normalizeTag);
    and.push({ tags: { hasSome: tags } });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { postcode: { contains: q, mode: "insensitive" } },
        // If q matches a tag token exactly (common case)
        { tags: { has: normalizeTag(q) } },
      ],
    });
  }

  if (filters.sensoryHours) {
    and.push({
      sensory: { is: { sensoryHours: filters.sensoryHours === "true" } },
    });
  }

  if (filters.quietSpace) {
    and.push({
      sensory: { is: { quietSpace: filters.quietSpace === "true" } },
    });
  }

  // ✅ NEW: noise / lighting / crowding filters (exact match)
  if (filters.noiseLevel) {
    and.push({ sensory: { is: { noiseLevel: filters.noiseLevel as any } } });
  }

  if (filters.lighting) {
    and.push({ sensory: { is: { lighting: filters.lighting as any } } });
  }

  if (filters.crowding) {
    and.push({ sensory: { is: { crowding: filters.crowding as any } } });
  }

  const where = and.length ? { AND: and } : {};

  /**
   * ✅ Sorting
   * Important: when the user chooses a sort, we should NOT force Verified first,
   * otherwise a 5★ unverified venue will be pushed down (which is what you’re seeing).
   */
  const sort = filters.sort ?? "";
  const orderBy: any[] = [];

  if (!sort) {
    // default "best match"
    orderBy.push({ verifiedAt: "desc" }, { lastReviewedAt: "desc" }, { createdAt: "desc" });
  } else if (sort === "highestRated") {
    orderBy.push(
      { avgRating: "desc" },
      { visibleReviewCount: "desc" }, // tie-breaker: more visible ratings
      { lastReviewedAt: "desc" },
      { createdAt: "desc" },
      { verifiedAt: "desc" } // only as a late tie-breaker
    );
  } else if (sort === "mostReviewed") {
    orderBy.push(
      { reviewCount: "desc" }, // total reviews (your current rule)
      { avgRating: "desc" },
      { lastReviewedAt: "desc" },
      { createdAt: "desc" },
      { verifiedAt: "desc" }
    );
  } else if (sort === "recentlyReviewed") {
    orderBy.push({ lastReviewedAt: "desc" }, { createdAt: "desc" }, { verifiedAt: "desc" });
  } else if (sort === "newest") {
    orderBy.push({ createdAt: "desc" }, { verifiedAt: "desc" });
  }

  const rows = await prisma.venue.findMany({
    where,
    orderBy,
    take: 50,
    select: {
      id: true,
      name: true,
      city: true,
      postcode: true,
      tags: true,
      verifiedAt: true,
      coverImageUrl: true,
      createdAt: true,

      // ✅ stored review stats (fast + sortable)
      avgRating: true,
      reviewCount: true, // your "total" count (hidden + visible)
      visibleReviewCount: true,
      lastReviewedAt: true,
    },
  });

  return rows.map((v) => ({
    ...v,
    // Keep the card API as you already use it:
    // - reviewCount = total (your current rule)
    // - avgRating = stored value (based on visible only, in your recompute function)
    reviewCount: v.reviewCount ?? 0,
    avgRating: typeof v.avgRating === "number" ? v.avgRating : null,
  }));
}
