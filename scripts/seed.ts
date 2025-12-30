import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.create({
    data: {
      name: "Test Venue",
      city: "Leeds",
      postcode: "LS1",
      tags: ["softplay", "sensory-friendly"],
      sensory: {
        create: {
          noiseLevel: "LOW",
          lighting: "MEDIUM",
          crowding: "LOW",
          quietSpace: true,
          sensoryHours: true,
          notes: "Test sensory profile",
        },
      },
      facilities: {
        create: {
          parking: true,
          accessibleToilet: true,
          babyChange: true,
          wheelchairAccess: true,
          staffTrained: false,
          notes: "Test facilities",
        },
      },
    },
    include: { sensory: true, facilities: true },
  });

  const all = await prisma.venue.findMany({ take: 5 });

  console.log("Created venue:", venue);
  console.log("First venues:", all);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
