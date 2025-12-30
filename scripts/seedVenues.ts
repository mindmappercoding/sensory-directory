import { PrismaClient, SensoryLevel } from "@prisma/client";

const prisma = new PrismaClient();

const cities = ["Leeds", "Bradford", "York", "Harrogate", "Wakefield"];
const countries = ["UK"] as const;

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
  "cafe",
  "playground",
];

const sensoryLevels: SensoryLevel[] = [
  "VERY_LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
];

function random<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min = 1, max = 4) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

function maybe<T>(value: T, probability = 0.7): T | null {
  return Math.random() < probability ? value : null;
}

function randomPhone() {
  return `07${Math.floor(100000000 + Math.random() * 899999999)}`;
}

function randomPostcode(city: string) {
  // Not “real”, but good enough for UI testing
  const prefix = city === "Leeds" ? "LS" : city === "York" ? "YO" : "BD";
  return `${prefix}${Math.floor(Math.random() * 29) + 1} ${Math.floor(
    Math.random() * 9
  )}AA`;
}

async function main() {
  console.log("🌱 Seeding venues…");

  // Wipe existing (children first)
  await prisma.review.deleteMany();
  await prisma.venueSubmission.deleteMany();
  await prisma.sensoryProfile.deleteMany();
  await prisma.facilities.deleteMany();
  await prisma.venue.deleteMany();

  const venues = Array.from({ length: 60 }).map((_, i) => {
    const city = random(cities);

    const hasCoords = Math.random() > 0.3;
    const lat = hasCoords ? 53.7 + (Math.random() - 0.5) * 0.4 : null; // rough Yorkshire-ish
    const lng = hasCoords ? -1.6 + (Math.random() - 0.5) * 0.6 : null;

    const reviewCount = Math.floor(Math.random() * 6); // 0-5 reviews

    return {
      name: `Test Venue ${i + 1} (${city})`,
      description:
        "Seeded venue for development/testing. Helpful for checking filters, cards, and venue detail pages.",
      website: maybe(`https://example.com/venue-${i + 1}`, 0.6),
      phone: maybe(randomPhone(), 0.5),

      address1: maybe(`${Math.floor(Math.random() * 200) + 1} High Street`, 0.6),
      address2: maybe("Unit 2", 0.25),
      city,
      postcode: randomPostcode(city),
      country: random(countries),

      lat: lat ?? undefined,
      lng: lng ?? undefined,

      tags: randomSubset(tagsPool, 2, 6),

      verifiedAt: Math.random() > 0.65 ? new Date() : null,

      sensory: {
        create: {
          noiseLevel: random(sensoryLevels),
          lighting: random(sensoryLevels),
          crowding: random(sensoryLevels),
          quietSpace: Math.random() > 0.5,
          sensoryHours: Math.random() > 0.5,
          notes: maybe("Auto-generated sensory profile notes.", 0.7),
        },
      },

      facilities: {
        create: {
          parking: Math.random() > 0.5,
          accessibleToilet: Math.random() > 0.5,
          babyChange: Math.random() > 0.5,
          wheelchairAccess: Math.random() > 0.5,
          staffTrained: Math.random() > 0.5,
          notes: maybe("Facilities notes.", 0.4),
        },
      },

      reviews: {
        create: Array.from({ length: reviewCount }).map((__, r) => ({
          rating: Math.floor(Math.random() * 5) + 1,
          title: maybe(["Lovely visit", "Good for kids", "A bit busy", "Great staff"][r % 4], 0.8),
          content: maybe(
            [
              "We felt much more confident coming here.",
              "Quiet space was helpful when my child needed a break.",
              "Could be overwhelming at peak times, but staff were kind.",
              "Would come again—sensory hours made a big difference.",
            ][r % 4],
            0.9
          ),
          visitTimeHint: maybe(
            ["Weekday mornings", "After school", "Weekend early", "Sensory session"][r % 4],
            0.85
          ),
        })),
      },
    };
  });

  for (const v of venues) {
    await prisma.venue.create({ data: v as any });
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
