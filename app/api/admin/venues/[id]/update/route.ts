import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
    select: { imageUrls: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const nextGallery =
    input.imageMode === "REPLACE"
      ? uniq(input.imageUrls ?? [])
      : uniq([...(existing.imageUrls ?? []), ...(input.imageUrls ?? [])]);

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
      postcode: input.postcode ?? null,
      county: input.county ?? null,

      tags: input.tags.map((t) => t.toLowerCase()),

      // ✅ images saved here
      coverImageUrl: input.coverImageUrl ?? null,
      imageUrls: nextGallery,

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
