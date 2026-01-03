// app/api/venues/near/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeUKPostcode } from "@/lib/postcodes";
import { haversineMeters } from "@/lib/distance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postcode = (searchParams.get("postcode") ?? "").trim();

  if (!postcode) {
    return NextResponse.json(
      { ok: false, error: "postcode is required" },
      { status: 400 }
    );
  }

  const origin = await geocodeUKPostcode(postcode);
  if (!origin) {
    return NextResponse.json(
      { ok: false, error: "Postcode not found / invalid" },
      { status: 400 }
    );
  }

  // NOTE: adjust the where clause if your public list uses different rules.
  // This matches your pattern of "not archived" (null or not set).
  const venues = await prisma.venue.findMany({
    where: {
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    select: {
      id: true,
      name: true,
      city: true,
      postcode: true,
      county: true,
      tags: true,
      coverImageUrl: true,
      imageUrls: true,
      lat: true,
      lng: true,
    },
  });

  const withDistance = venues
    .map((v) => {
      const hasCoords =
        typeof v.lat === "number" && typeof v.lng === "number";
      const distanceMeters = hasCoords
        ? haversineMeters(origin, { lat: v.lat!, lng: v.lng! })
        : null;

      return {
        ...v,
        distanceMeters,
        distanceKm: distanceMeters == null ? null : distanceMeters / 1000,
      };
    })
    .sort((a, b) => {
      const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
      const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

  return NextResponse.json({ ok: true, origin, venues: withDistance });
}
