import { PrismaClient, SensoryLevel } from "@prisma/client";

const prisma = new PrismaClient();

const cities = ["Leeds", "Bradford", "York", "Harrogate", "Wakefield"];
const tagsPool = [
  "softplay",
  "cinema",
  "museum",
  "park",
  "swimming",
  "sensory-friendly",
  "family",
  "indoor",
  "outdoor",
];

function random<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min = 1, max = 4) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

async function main() {
  console.log("🌱 Seeding venues…");

  // OPTIONAL: wipe existing venues
  await prisma.review.deleteMany();
  await prisma.venueSubmission.deleteMany();
  await prisma.sensoryProfile.deleteMany();
  await prisma.facilities.deleteMany();
  await prisma.venue.deleteMany();

  const venues = Array.from({ length: 40 }).map((_, i) => {
    const city = random(cities);

    return {
      name: `Test Venue ${i + 1} (${city})`,
      description: "This is a seeded venue used for development and testing.",
      city,
      postcode: `LS${Math.floor(Math.random() * 29) + 1}`,
      tags: randomSubset(tagsPool),
      sensory: {
        create: {
          noiseLevel: random(["LOW", "MEDIUM", "HIGH"]) as SensoryLevel,
          lighting: random(["LOW", "MEDIUM", "HIGH"]) as SensoryLevel,
          crowding: random(["LOW", "MEDIUM", "HIGH"]) as SensoryLevel,
          quietSpace: Math.random() > 0.5,
          sensoryHours: Math.random() > 0.5,
          notes: "Auto-generated sensory profile",
        },
      },
      facilities: {
        create: {
          parking: Math.random() > 0.5,
          accessibleToilet: Math.random() > 0.5,
          babyChange: Math.random() > 0.5,
          wheelchairAccess: Math.random() > 0.5,
          staffTrained: Math.random() > 0.5,
        },
      },
    };
  });

  for (const v of venues) {
    await prisma.venue.create({
      data: v,
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
