// lib/venues.ts
import { prisma } from "@/lib/prisma";

type Filters = {
  q?: string;
  city?: string;
  tags?: string[]; // ✅ multi
  sensoryHours?: "true" | "false";
  quietSpace?: "true" | "false";
};

export async function listVenues(filters: Filters) {
  const and: any[] = [];

  // ✅ Always exclude archived venues (and do NOT overwrite this later)
  and.push({
    OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }], // Mongo-only isSet
  });

  if (filters.city) {
    and.push({ city: { equals: filters.city.trim(), mode: "insensitive" } });
  }

  if (filters.tags?.length) {
    const tags = filters.tags.map((t) => t.toLowerCase());
    // "hasSome" = match ANY selected tag. (Change to hasEvery if you want ALL.)
    and.push({ tags: { hasSome: tags } });
  }

  if (filters.q) {
    const tokens = filters.q.trim().split(/\s+/).filter(Boolean).slice(0, 6);

    // ✅ Each token must appear in the venue NAME (title) only
    and.push({
      AND: tokens.map((t) => ({
        name: { contains: t, mode: "insensitive" },
      })),
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

  const where = and.length ? { AND: and } : {};

  return prisma.venue.findMany({
    where,
    orderBy: [
      { verifiedAt: "desc" }, // ✅ verified first feels nice
      { createdAt: "desc" },
    ],
    take: 50,
    select: {
      id: true,
      name: true,
      city: true,
      postcode: true,
      tags: true,
      verifiedAt: true,
    },
  });
}
