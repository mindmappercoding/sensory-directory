// scripts/recomputeReviewStats.ts
import { prisma } from "../lib/prisma";
import { recomputeVenueReviewStats } from "../lib/review-stats";

async function main() {
  const venues = await prisma.venue.findMany({ select: { id: true, name: true } });

  let i = 0;
  for (const v of venues) {
    await recomputeVenueReviewStats(prisma, v.id);
    i++;
    if (i % 25 === 0) {
      console.log(`Recomputed ${i}/${venues.length}`);
    }
  }

  console.log(`Done. Recomputed ${venues.length} venues.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
