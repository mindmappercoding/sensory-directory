// scripts/seedOneVenue.ts
import { prisma } from "../lib/prisma";

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

function normPostcode(pc: string) {
  return pc.toUpperCase().replace(/\s+/g, " ").trim();
}

async function main() {
  const name = "Super Soft Play (Test)";
  const postcode = normPostcode("LS21 3AB");

  // Pick a real-ish UK location (Otley-ish). Adjust if you like.
  const lat = 53.905;
  const lng = -1.693;
  const geohash = geohashEncode(lat, lng, 9);

  // Create a fully-populated venue (no reviews to avoid schema mismatch)
  const venue = await prisma.venue.create({
    data: {
      name,
      description: "A seeded test venue with full data for UI + admin testing.",
      website: "https://example.com",
      phone: "01943000000",

      address1: "12 Example Road",
      address2: "Otley",
      city: "Otley",
      postcode,
      county: "West Yorkshire",
      country: "UK",

      tags: ["softplay", "indoor", "family"],

      // Use any valid image URLs (placeholders are fine for UI tests)
      coverImageUrl: "https://placehold.co/1200x675/png?text=Cover+Image",
      imageUrls: [
        "https://placehold.co/600x600/png?text=Gallery+1",
        "https://placehold.co/600x600/png?text=Gallery+2",
      ],

      lat,
      lng,
      geohash,

      verifiedAt: new Date(),

      sensory: {
        create: {
          noiseLevel: "MEDIUM",
          lighting: "LOW",
          crowding: "MEDIUM",
          quietSpace: true,
          sensoryHours: false,
          notes:
            "Test note: quieter in the morning. Bring ear defenders at peak times.",
        },
      },

      facilities: {
        create: {
          parking: true,
          accessibleToilet: true,
          babyChange: true,
          wheelchairAccess: true,
          staffTrained: true,
          notes:
            "Test note: ramp access at side entrance. Staff happy to help with seating.",
        },
      },
    },
    select: { id: true, name: true, postcode: true },
  });

  console.log("✅ Seeded venue:", venue.id, venue.name, venue.postcode);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
