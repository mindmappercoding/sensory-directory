import { prisma } from "@/lib/prisma";

export async function GET() {
  const venues = await prisma.venue.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { sensory: true, facilities: true },
  });

  return Response.json({ ok: true, venues });
}
