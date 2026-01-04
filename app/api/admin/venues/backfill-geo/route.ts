// app/api/admin/venues/backfill-geo/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normPostcode(pc: string) {
  return pc.toUpperCase().replace(/\s+/g, " ").trim();
}

async function geocodeUKPostcode(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const pc = normPostcode(postcode);
  if (!pc) return null;

  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
    { cache: "no-store" }
  );
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const limit =
    typeof body?.limit === "number" && body.limit > 0
      ? Math.min(body.limit, 200)
      : 50;

  const venues = await prisma.venue.findMany({
    where: {
      postcode: { not: null },
      OR: [
        { lat: null },
        { lat: { isSet: false } as any },
        { lng: null },
        { lng: { isSet: false } as any },
      ],
      AND: [
        {
          OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
        },
      ],
    },
    select: { id: true, postcode: true },
    take: limit,
  });

  let updated = 0;
  let skipped = 0;

  for (const v of venues) {
    const postcode =
      typeof v.postcode === "string" ? normPostcode(v.postcode) : "";
    if (!postcode) {
      skipped++;
      continue;
    }

    const geo = await geocodeUKPostcode(postcode).catch(() => null);
    if (!geo) {
      skipped++;
      continue;
    }

    const geohash = geohashEncode(geo.lat, geo.lng, 9);

    await prisma.venue.update({
      where: { id: v.id },
      data: {
        postcode,
        lat: geo.lat,
        lng: geo.lng,
        geohash,
      },
    });

    updated++;
  }

  return NextResponse.json({ ok: true, updated, skipped });
}
