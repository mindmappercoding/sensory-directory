// lib/venues.ts
import { prisma } from "@/lib/prisma";
import type { SensoryLevel } from "@prisma/client";

export type Filters = {
  q?: string;
  city?: string;
  tags?: string[];
  sensoryHours?: "true" | "false";
  quietSpace?: "true" | "false";

  // ✅ NEW
  noiseLevel?: SensoryLevel;
  lighting?: SensoryLevel;
  crowding?: SensoryLevel;

  // ✅ optional sorting
  sort?: "newest" | "recentlyReviewed" | "highestRated" | "mostReviewed";
};

function normalizeTagToken(t: string) {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ");
}

function tokenizeQuery(q: string) {
  return q
    .split(/[\s,]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export async function listVenues(filters: Filters) {
  const and: any[] = [];

  // ✅ exclude archived
  and.push({
    OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
  });

  if (filters.city?.trim()) {
    // keep forgiving; change to equals() if you want strict matching
    and.push({ city: { contains: filters.city.trim(), mode: "insensitive" } });
  }

  if (filters.tags?.length) {
    const tags = filters.tags.map((t) => normalizeTagToken(t));
    and.push({ tags: { hasSome: tags } });
  }

  if (filters.q?.trim()) {
    const terms = tokenizeQuery(filters.q.trim());

    // every term must match at least one field
    and.push({
      AND: terms.map((raw) => {
        const term = raw;
        const tagToken = normalizeTagToken(raw);
        const tagCompact = tagToken.replace(/\s+/g, ""); // "soft play" -> "softplay"

        return {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { city: { contains: term, mode: "insensitive" } },
            { postcode: { contains: term, mode: "insensitive" } },
            { tags: { has: tagToken } },
            tagCompact !== tagToken ? { tags: { has: tagCompact } } : undefined,
          ].filter(Boolean),
        };
      }),
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

  // ✅ NEW sensory level filters
  if (filters.noiseLevel) {
    and.push({ sensory: { is: { noiseLevel: filters.noiseLevel } } });
  }
  if (filters.lighting) {
    and.push({ sensory: { is: { lighting: filters.lighting } } });
  }
  if (filters.crowding) {
    and.push({ sensory: { is: { crowding: filters.crowding } } });
  }

  const where = and.length ? { AND: and } : {};

  // ✅ sorting
  const orderBy: any[] = [{ verifiedAt: "desc" }];
  switch (filters.sort) {
    case "highestRated":
      orderBy.push(
        { avgRating: "desc" },
        { visibleReviewCount: "desc" },
        { lastReviewedAt: "desc" },
        { createdAt: "desc" }
      );
      break;
    case "mostReviewed":
      orderBy.push(
        { visibleReviewCount: "desc" },
        { avgRating: "desc" },
        { lastReviewedAt: "desc" },
        { createdAt: "desc" }
      );
      break;
    case "recentlyReviewed":
      orderBy.push({ lastReviewedAt: "desc" }, { createdAt: "desc" });
      break;
    case "newest":
      orderBy.push({ createdAt: "desc" });
      break;
    default:
      orderBy.push({ lastReviewedAt: "desc" }, { createdAt: "desc" });
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

      // ✅ stored stats (fast + consistent)
      avgRating: true,
      visibleReviewCount: true,
      reviewCount: true,
      lastReviewedAt: true,
    },
  });

  // keep card shape stable
  return rows.map((v) => ({
    ...v,
    reviewCount: v.visibleReviewCount ?? 0, // public-facing count
    avgRating: typeof v.avgRating === "number" ? v.avgRating : null,

    // optional (if you ever want “total reviews incl hidden” on admin pages)
    totalReviewCount: v.reviewCount ?? 0,
  }));
}
