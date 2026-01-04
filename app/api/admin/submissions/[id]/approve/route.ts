// app/api/admin/submissions/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { venueSubmissionSchema } from "@/lib/validators/venueSubmission";
import { geocodeUKPostcode, normalizeUKPostcode } from "@/lib/postcodes";

export const runtime = "nodejs";

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

function normalizeUrlOrNull(v?: string | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function normalizeUrlArray(v?: unknown) {
  const arr = Array.isArray(v) ? v : [];
  return arr
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .map((x) => (x as string).trim())
    .slice(0, 10);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const force = new URL(req.url).searchParams.get("force") === "1";

  // ✅ optional verify from request body
  let verify = false;
  try {
    const body = await req.json().catch(() => ({}));
    verify = !!(body as any)?.verify;
  } catch {
    verify = false;
  }

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
      { error: "Submission payload invalid", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // normalize images
  const coverImageUrl = normalizeUrlOrNull(input.coverImageUrl ?? null);
  const imageUrls = normalizeUrlArray(input.imageUrls);

  // normalize postcode
  const postcode = normalizeUKPostcode(input.postcode);

  // Duplicate guard (same postcode)
  // For EDIT submissions, exclude the current venue from "dupe" list
  const dupeWhere: any = {
    postcode,
    OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
  };

  if (submission.type === "EDIT_VENUE" && submission.venueId) {
    dupeWhere.NOT = { id: submission.venueId };
  }

  const dupes = await prisma.venue.findMany({
    where: dupeWhere,
    select: { id: true, name: true, city: true, postcode: true },
    take: 10,
  });

  if (dupes.length > 0 && !force) {
    return NextResponse.json(
      {
        error:
          "Possible duplicate venue detected (same postcode). Review before approving, or approve with force.",
        duplicates: dupes,
      },
      { status: 409 }
    );
  }

  // Geo best-effort (postcode centroid)
  const geo = await geocodeUKPostcode(postcode).catch(() => null);
  const lat = geo?.lat ?? null;
  const lng = geo?.lng ?? null;
  const geohash =
    lat !== null && lng !== null ? geohashEncode(lat, lng, 9) : null;

  const now = new Date();

  const venue = await prisma.$transaction(async (tx) => {
    if (submission.type === "NEW_VENUE") {
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

          // ✅ location stored on approval
          lat,
          lng,
          geohash,

          // ✅ verified only if checkbox is ticked
          verifiedAt: verify ? now : null,

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
          reviewedAt: now,
          venueId: created.id,
        },
      });

      return created;
    }

    // EDIT_VENUE
    if (submission.type === "EDIT_VENUE") {
      if (!submission.venueId) {
        throw new Error("Missing venueId for EDIT_VENUE submission");
      }

      const updated = await tx.venue.update({
        where: { id: submission.venueId },
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

          // ✅ location stored on approval
          lat,
          lng,
          geohash,

          // ✅ only update verifiedAt if checkbox is ticked
          ...(verify ? { verifiedAt: now } : {}),

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
        select: { id: true },
      });

      await tx.venueSubmission.update({
        where: { id: submission.id },
        data: {
          status: "APPROVED",
          reviewedAt: now,
          venueId: updated.id,
        },
      });

      return updated;
    }

    throw new Error("Unknown submission type");
  });

  return NextResponse.json({ ok: true, venueId: venue.id });
}
