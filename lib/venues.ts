import { prisma } from "@/lib/prisma";

type Filters = {
  q?: string;
  city?: string;
  tag?: string;
  sensoryHours?: "true" | "false";
  quietSpace?: "true" | "false";
};

export async function listVenues(filters: Filters) {
  const where: any = {};

  if (filters.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }

  if (filters.tag) {
    // tags is String[]
    where.tags = { has: filters.tag.toLowerCase() };
  }

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { postcode: { contains: q, mode: "insensitive" } },
      // optional: tag search via hasSome if you store tags normalized
      { tags: { has: q.toLowerCase() } },
    ];
  }

  if (filters.sensoryHours) {
    where.sensory = {
      is: { sensoryHours: filters.sensoryHours === "true" },
    };
  }

  if (filters.quietSpace) {
    where.sensory = {
      ...(where.sensory ?? {}),
      is: {
        ...(where.sensory?.is ?? {}),
        quietSpace: filters.quietSpace === "true",
      },
    };
  }

  return prisma.venue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, city: true, postcode: true, tags: true },
  });
}
