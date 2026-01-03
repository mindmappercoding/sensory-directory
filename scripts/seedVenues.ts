// scripts/seedVenues.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Simple geohash encoder (base32). Precision 9 is good enough for UI sorting/grouping.
 */
const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function geohashEncode(lat: number, lng: number, precision = 9) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;

  let latMin = -90,
    latMax = 90;
  let lngMin = -180,
    lngMax = 180;

  let geohash = "";

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        idx = (idx << 1) + 1;
        lngMin = mid;
      } else {
        idx = (idx << 1) + 0;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        idx = (idx << 1) + 1;
        latMin = mid;
      } else {
        idx = (idx << 1) + 0;
        latMax = mid;
      }
    }

    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += GEOHASH_BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function uniq(arr: string[]) {
  return Array.from(new Set((arr ?? []).filter(Boolean)));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TAG_POOL = [
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

const LEVELS = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;

// Cloudinary demo images (handy for testing)
const demoCovers = [
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1400,h_900/sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1400,h_900/park.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1400,h_900/lady.jpg",
];

const demoGallery = [
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_800/sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_800/park.jpg",
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_800/lady.jpg",
];

const baseLocations = [
  { city: "Leeds", postcode: "LS1 4DT", county: "West Yorkshire", lat: 53.8008, lng: -1.5491 },
  { city: "Otley", postcode: "LS21 3AB", county: "West Yorkshire", lat: 53.9058, lng: -1.6932 },
  { city: "Bradford", postcode: "BD1 1UB", county: "West Yorkshire", lat: 53.7950, lng: -1.7594 },
  { city: "Harrogate", postcode: "HG1 1AA", county: "North Yorkshire", lat: 53.9900, lng: -1.5418 },
  { city: "York", postcode: "YO1 6GA", county: "North Yorkshire", lat: 53.9590, lng: -1.0815 },
  { city: "Wakefield", postcode: "WF1 1NE", county: "West Yorkshire", lat: 53.6830, lng: -1.4977 },
  { city: "Halifax", postcode: "HX1 1BL", county: "West Yorkshire", lat: 53.7250, lng: -1.8570 },
  { city: "Huddersfield", postcode: "HD1 1AA", county: "West Yorkshire", lat: 53.6458, lng: -1.7850 },
  { city: "Skipton", postcode: "BD23 1AH", county: "North Yorkshire", lat: 53.9620, lng: -2.0160 },
  { city: "Ilkley", postcode: "LS29 9DP", county: "West Yorkshire", lat: 53.9240, lng: -1.8220 },
  { city: "Knaresborough", postcode: "HG5 8AG", county: "North Yorkshire", lat: 54.0090, lng: -1.4700 },
  { city: "Wetherby", postcode: "LS22 6LT", county: "West Yorkshire", lat: 53.9280, lng: -1.3860 },
  { city: "Pontefract", postcode: "WF8 1PG", county: "West Yorkshire", lat: 53.6910, lng: -1.3120 },
  { city: "Castleford", postcode: "WF10 1EG", county: "West Yorkshire", lat: 53.7250, lng: -1.3620 },
  { city: "Dewsbury", postcode: "WF13 1AA", county: "West Yorkshire", lat: 53.6920, lng: -1.6330 },
  { city: "Keighley", postcode: "BD21 2AD", county: "West Yorkshire", lat: 53.8670, lng: -1.9100 },
  { city: "Shipley", postcode: "BD18 3RT", county: "West Yorkshire", lat: 53.8330, lng: -1.7700 },
  { city: "Morley", postcode: "LS27 8DQ", county: "West Yorkshire", lat: 53.7450, lng: -1.5980 },
  { city: "Garforth", postcode: "LS25 1DS", county: "West Yorkshire", lat: 53.7910, lng: -1.3800 },
  { city: "Tadcaster", postcode: "LS24 9JG", county: "North Yorkshire", lat: 53.8850, lng: -1.2640 },
];

async function seedVenues() {
  console.log("Seeding 20 venues…");

  for (let i = 0; i < 20; i++) {
    const loc = baseLocations[i];

    const tags = uniq([
      TAG_POOL[i % TAG_POOL.length],
      TAG_POOL[(i + 3) % TAG_POOL.length],
      "family",
    ])
      .map((t) => t.toLowerCase())
      .slice(0, 4);

    await prisma.venue.create({
      data: {
        name: `${loc.city} Sensory Spot ${i + 1}`,
        description:
          "Test venue for development: calmer options, clear signage, and family-friendly facilities.",
        website: `https://example.com/${loc.city.toLowerCase()}-${i + 1}`,
        phone: `01${(100 + i).toString()} 000 00${(10 + i).toString().slice(-2)}`,

        address1: `${10 + i} Example Road`,
        address2: null,
        city: loc.city,
        postcode: loc.postcode,
        county: loc.county,
        country: "UK",

        lat: loc.lat,
        lng: loc.lng,
        geohash: geohashEncode(loc.lat, loc.lng, 9),

        tags,

        coverImageUrl: demoCovers[i % demoCovers.length],
        imageUrls: [
          demoGallery[i % demoGallery.length],
          demoGallery[(i + 1) % demoGallery.length],
        ],

        // start with empty stats; we’ll compute after creating Review docs
        avgRating: null,
        visibleReviewCount: 0,
        hiddenReviewCount: 0,
        reviewCount: 0,
        lastReviewedAt: null,

        verifiedAt: i % 3 === 0 ? null : daysAgo((i % 14) + 1),

        sensory: {
          create: {
            noiseLevel: LEVELS[i % LEVELS.length],
            lighting: LEVELS[(i + 1) % LEVELS.length],
            crowding: LEVELS[(i + 2) % LEVELS.length],
            quietSpace: i % 2 === 0,
            sensoryHours: i % 4 !== 0,
            notes: i % 6 === 0 ? "Staff can reduce music on request." : null,
          },
        },

        facilities: {
          create: {
            parking: i % 2 === 1,
            accessibleToilet: true,
            babyChange: i % 3 !== 0,
            wheelchairAccess: true,
            staffTrained: i % 4 !== 0,
            notes: i % 7 === 0 ? "Ask at front desk for a quieter table." : null,
          },
        },
      },
      select: { id: true },
    });
  }
}

async function seedUsers() {
  console.log("Seeding 12 users…");

  const users = [
    { name: "Alex", email: "alex@test.local" },
    { name: "Sam", email: "sam@test.local" },
    { name: "Jamie", email: "jamie@test.local" },
    { name: "Taylor", email: "taylor@test.local" },
    { name: "Morgan", email: "morgan@test.local" },
    { name: "Casey", email: "casey@test.local" },
    { name: "Riley", email: "riley@test.local" },
    { name: "Jordan", email: "jordan@test.local" },
    { name: "Avery", email: "avery@test.local" },
    { name: "Cameron", email: "cameron@test.local" },
    { name: "Drew", email: "drew@test.local" },
    { name: "Quinn", email: "quinn@test.local" },
  ];

  for (const u of users) {
    // upsert so reruns don't explode on unique email
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { name: u.name, email: u.email },
      select: { id: true },
    });
  }
}

async function seedReviews() {
  console.log("Seeding reviews…");

  const venues = await prisma.venue.findMany({
    select: { id: true, name: true },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  if (venues.length === 0 || users.length === 0) {
    console.log("No venues/users found; skipping reviews.");
    return;
  }

  const titles = [
    "Lovely calm vibe",
    "Great for sensory needs",
    "Good but can get busy",
    "Helpful staff",
    "Would visit again",
  ];

  const contents = [
    "We had a really manageable visit. Clear layout and friendly staff.",
    "Noise was lower than expected and there was space to take breaks.",
    "Great place overall — just try a quieter time if you can.",
    "Staff were understanding and happy to help.",
    "A solid option for families. We’ll be back.",
  ];

  for (let i = 0; i < venues.length; i++) {
    const v = venues[i];

    // 0–6 reviews per venue
    const reviewCount = randInt(0, 6);
    const authors = shuffle(users).slice(0, reviewCount);

    for (let j = 0; j < authors.length; j++) {
      const u = authors[j];

      const rating = randInt(3, 5);
      const createdAt = daysAgo(randInt(1, 30));

      // ~15% hidden reviews
      const isHidden = Math.random() < 0.15;

      await prisma.review.create({
        data: {
          venueId: v.id,
          authorId: u.id,
          authorName: u.name ?? "Anonymous",

          rating,
          title: titles[randInt(0, titles.length - 1)],
          content: contents[randInt(0, contents.length - 1)],
          visitTimeHint: ["Weekday AM", "Weekend", "After school", "Morning", "Lunch"][randInt(0, 4)],

          // optional “sensory snapshot”
          noiseLevel: LEVELS[randInt(0, LEVELS.length - 1)] as any,
          lighting: LEVELS[randInt(0, LEVELS.length - 1)] as any,
          crowding: LEVELS[randInt(0, LEVELS.length - 1)] as any,
          quietSpace: Math.random() < 0.6,
          sensoryHours: Math.random() < 0.35,

          createdAt,

          hiddenAt: isHidden ? daysAgo(randInt(0, 10)) : null,
          hiddenBy: isHidden ? "seed-script" : null,
          hideReason: isHidden ? "Seeded hidden example" : null,
        },
      });
    }
  }
}

async function recomputeVenueReviewStats() {
  console.log("Recomputing venue review stats…");

  const reviews = await prisma.review.findMany({
    select: { venueId: true, rating: true, hiddenAt: true, createdAt: true },
  });

  const byVenue = new Map<
    string,
    {
      visibleCount: number;
      hiddenCount: number;
      visibleSum: number;
      latestVisible: Date | null;
    }
  >();

  for (const r of reviews) {
    const key = r.venueId;
    const entry =
      byVenue.get(key) ??
      { visibleCount: 0, hiddenCount: 0, visibleSum: 0, latestVisible: null };

    const isHidden = !!r.hiddenAt;

    if (isHidden) {
      entry.hiddenCount += 1;
    } else {
      entry.visibleCount += 1;
      entry.visibleSum += r.rating;

      if (!entry.latestVisible || r.createdAt > entry.latestVisible) {
        entry.latestVisible = r.createdAt;
      }
    }

    byVenue.set(key, entry);
  }

  const updates = Array.from(byVenue.entries()).map(([venueId, s]) => {
    const avg =
      s.visibleCount > 0 ? Number((s.visibleSum / s.visibleCount).toFixed(2)) : null;

    return prisma.venue.update({
      where: { id: venueId },
      data: {
        avgRating: avg,
        visibleReviewCount: s.visibleCount,
        hiddenReviewCount: s.hiddenCount,
        reviewCount: s.visibleCount, // keep compatibility: reviewCount = visibleReviewCount
        lastReviewedAt: s.latestVisible ?? null,
      },
      select: { id: true },
    });
  });

  if (updates.length) {
    await prisma.$transaction(updates);
  }
}

async function main() {
  await seedVenues();
  await seedUsers();
  await seedReviews();
  await recomputeVenueReviewStats();

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
