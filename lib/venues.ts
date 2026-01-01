// lib/venues.ts
import { prisma } from "@/lib/prisma";

type Filters = {
  q?: string; // search venue name only (MVP)
  city?: string;
  tags?: string[];
  sensoryHours?: "true" | "false";
  quietSpace?: "true" | "false";
};

export async function listVenues(filters: Filters) {
  const and: any[] = [];

  // ✅ Always exclude archived venues
  and.push({
    OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
  });

  if (filters.city) {
    and.push({ city: { equals: filters.city.trim(), mode: "insensitive" } });
  }

  if (filters.tags?.length) {
    const tags = filters.tags.map((t) => t.toLowerCase());
    and.push({ tags: { hasSome: tags } });
  }

  if (filters.q) {
    const q = filters.q.trim();
    if (q) {
      and.push({
        name: { contains: q, mode: "insensitive" },
      });
    }
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

  const where = and.length ? { AND: and } : {};

  const venues = await prisma.venue.findMany({
    where,
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      city: true,
      postcode: true,
      tags: true,
      verifiedAt: true,
      coverImageUrl: true,
      reviewCount: true, // ✅ existing field in Venue model
    },
  });

  const ids = venues.map((v) => v.id);
  if (!ids.length) return venues.map((v) => ({ ...v, avgRating: null as number | null }));

  const stats = await prisma.review.groupBy({
    by: ["venueId"],
    where: { venueId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const statsMap = new Map(
    stats.map((s) => [
      s.venueId,
      {
        avgRating: s._avg.rating ?? null,
        count: s._count._all ?? 0,
      },
    ])
  );

  return venues.map((v) => {
    const s = statsMap.get(v.id);
    return {
      ...v,
      // prefer groupBy count (truth), but keep venue.reviewCount too
      reviewCount: s?.count ?? v.reviewCount ?? 0,
      avgRating: s?.avgRating ?? null,
    };
  });
}
