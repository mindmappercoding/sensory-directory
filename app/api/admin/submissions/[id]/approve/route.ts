// app/api/admin/submissions/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { venueSubmissionSchema } from "@/lib/validators/venueSubmission";

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const force = new URL(req.url).searchParams.get("force") === "1";

  const submission = await prisma.venueSubmission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (submission.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot approve submission in status ${submission.status}` },
      { status: 400 }
    );
  }

  // Validate payload + proposedName together
  const parsed = venueSubmissionSchema.safeParse({
    proposedName: submission.proposedName ?? undefined,
    ...(submission.payload as Record<string, unknown>),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Submission payload invalid",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // normalize images
  const coverImageUrl =
    input.coverImageUrl && input.coverImageUrl.trim().length > 0
      ? input.coverImageUrl.trim()
      : null;

  const imageUrls = (input.imageUrls ?? [])
    .filter((u) => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, 10);

  // Duplicate guard (same postcode)
  const postcode = normPostcode(input.postcode);
  const dupes = await prisma.venue.findMany({
    where: {
      postcode,
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    select: { id: true, name: true, city: true, postcode: true },
    take: 10,
  });

  if (dupes.length > 0 && !force) {
    return NextResponse.json(
      {
        error: "Possible duplicate venue detected (same postcode). Review before approving, or approve with force.",
        duplicates: dupes,
      },
      { status: 409 }
    );
  }

  // Geo best-effort
  const geo = await geocodeUKPostcode(postcode).catch(() => null);
  const lat = geo?.lat ?? null;
  const lng = geo?.lng ?? null;
  const geohash = lat !== null && lng !== null ? geohashEncode(lat, lng, 9) : null;

  const venue = await prisma.$transaction(async (tx) => {
    const created = await tx.venue.create({
      data: {
        name: input.proposedName,

        description: input.description ?? null,
        website: input.website || null,
        phone: input.phone || null,

        address1: input.address1 ?? null,
        address2: input.address2 ?? null,
        city: input.city ?? null,
        postcode,
        county: input.county ?? null,
        country: "UK",

        tags: input.tags.map((t) => t.toLowerCase()),

        coverImageUrl,
        imageUrls,

        lat,
        lng,
        geohash,

        verifiedAt: new Date(),

        sensory: input.sensory
          ? {
              create: {
                noiseLevel: input.sensory.noiseLevel ?? null,
                lighting: input.sensory.lighting ?? null,
                crowding: input.sensory.crowding ?? null,
                quietSpace: input.sensory.quietSpace ?? null,
                sensoryHours: input.sensory.sensoryHours ?? null,
                notes: input.sensory.notes ?? null,
              },
            }
          : undefined,

        facilities: input.facilities
          ? {
              create: {
                parking: input.facilities.parking ?? null,
                accessibleToilet: input.facilities.accessibleToilet ?? null,
                babyChange: input.facilities.babyChange ?? null,
                wheelchairAccess: input.facilities.wheelchairAccess ?? null,
                staffTrained: input.facilities.staffTrained ?? null,
                notes: input.facilities.notes ?? null,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    await tx.venueSubmission.update({
      where: { id: submission.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        venueId: created.id,
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, venueId: venue.id });
}
