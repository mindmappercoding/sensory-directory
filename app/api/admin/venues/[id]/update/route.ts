import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SensoryLevel = z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);

const UpdateVenueSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(800).optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),

  address1: z.string().optional().nullable(),
  address2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  county: z.string().optional().nullable(),

  tags: z.array(z.string()).default([]),

  // ✅ images (admin can update after creation)
  coverImageUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional().default([]),

  sensory: z
    .object({
      noiseLevel: SensoryLevel.optional().nullable(),
      lighting: SensoryLevel.optional().nullable(),
      crowding: SensoryLevel.optional().nullable(),
      quietSpace: z.boolean().optional().nullable(),
      sensoryHours: z.boolean().optional().nullable(),
      notes: z.string().max(600).optional().nullable(),
    })
    .optional(),

  facilities: z
    .object({
      parking: z.boolean().optional().nullable(),
      accessibleToilet: z.boolean().optional().nullable(),
      babyChange: z.boolean().optional().nullable(),
      wheelchairAccess: z.boolean().optional().nullable(),
      staffTrained: z.boolean().optional().nullable(),
      notes: z.string().max(600).optional().nullable(),
    })
    .optional(),

  // ✅ decide how to handle gallery updates
  // "REPLACE" = overwrite gallery
  // "APPEND"  = add to existing (dedupe)
  imageMode: z.enum(["REPLACE", "APPEND"]).optional().default("APPEND"),
});

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function normPostcode(pc: string) {
  return pc.trim().toUpperCase().replace(/\s+/g, " ");
}

async function geocodeUKPostcode(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const pc = normPostcode(postcode);
  if (!pc) return null;

  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    result?: { latitude: number | null; longitude: number | null } | null;
  };

  const lat = json?.result?.latitude ?? null;
  const lng = json?.result?.longitude ?? null;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateVenueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const existing = await prisma.venue.findUnique({
    where: { id },
    // ✅ we need postcode + coords to decide if we should re-geocode
    select: { postcode: true, imageUrls: true, lat: true, lng: true, geohash: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const nextGallery =
    input.imageMode === "REPLACE"
      ? uniq(input.imageUrls ?? [])
      : uniq([...(existing.imageUrls ?? []), ...(input.imageUrls ?? [])]);

  // ✅ If postcode changes, refresh lat/lng/geohash (best-effort)
  const nextPostcode = input.postcode ?? null;
  const prevPostcode = existing.postcode ?? null;

  let nextLat = existing.lat ?? null;
  let nextLng = existing.lng ?? null;
  let nextGeohash = existing.geohash ?? null;

  const postcodeChanged =
    (prevPostcode ?? "") !== (nextPostcode ?? "");

  if (postcodeChanged) {
    if (!nextPostcode || !nextPostcode.trim()) {
      // postcode cleared -> clear geo fields too
      nextLat = null;
      nextLng = null;
      nextGeohash = null;
    } else {
      const geo = await geocodeUKPostcode(nextPostcode);
      if (geo) {
        nextLat = geo.lat;
        nextLng = geo.lng;
        nextGeohash = geohashEncode(geo.lat, geo.lng, 9);
      } else {
        // keep them null if lookup fails (don’t block the edit)
        nextLat = null;
        nextLng = null;
        nextGeohash = null;
      }
    }
  }

  await prisma.venue.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description ?? null,
      website: input.website ?? null,
      phone: input.phone ?? null,

      address1: input.address1 ?? null,
      address2: input.address2 ?? null,
      city: input.city ?? null,
      postcode: nextPostcode,
      county: input.county ?? null,

      tags: input.tags.map((t) => t.toLowerCase()),

      // ✅ images saved here
      coverImageUrl: input.coverImageUrl ?? null,
      imageUrls: nextGallery,

      // ✅ geo saved here
      lat: nextLat,
      lng: nextLng,
      geohash: nextGeohash,

      sensory: input.sensory
        ? {
            upsert: {
              create: {
                noiseLevel: input.sensory.noiseLevel ?? null,
                lighting: input.sensory.lighting ?? null,
                crowding: input.sensory.crowding ?? null,
                quietSpace: input.sensory.quietSpace ?? null,
                sensoryHours: input.sensory.sensoryHours ?? null,
                notes: input.sensory.notes ?? null,
              },
              update: {
                noiseLevel: input.sensory.noiseLevel ?? null,
                lighting: input.sensory.lighting ?? null,
                crowding: input.sensory.crowding ?? null,
                quietSpace: input.sensory.quietSpace ?? null,
                sensoryHours: input.sensory.sensoryHours ?? null,
                notes: input.sensory.notes ?? null,
              },
            },
          }
        : undefined,

      facilities: input.facilities
        ? {
            upsert: {
              create: {
                parking: input.facilities.parking ?? null,
                accessibleToilet: input.facilities.accessibleToilet ?? null,
                babyChange: input.facilities.babyChange ?? null,
                wheelchairAccess: input.facilities.wheelchairAccess ?? null,
                staffTrained: input.facilities.staffTrained ?? null,
                notes: input.facilities.notes ?? null,
              },
              update: {
                parking: input.facilities.parking ?? null,
                accessibleToilet: input.facilities.accessibleToilet ?? null,
                babyChange: input.facilities.babyChange ?? null,
                wheelchairAccess: input.facilities.wheelchairAccess ?? null,
                staffTrained: input.facilities.staffTrained ?? null,
                notes: input.facilities.notes ?? null,
              },
            },
          }
        : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
