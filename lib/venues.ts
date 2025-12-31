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
    // ✅ NAME ONLY search (as you requested)
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

  return prisma.venue.findMany({
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
      coverImageUrl: true, // ✅ NEW
    },
  });
}
