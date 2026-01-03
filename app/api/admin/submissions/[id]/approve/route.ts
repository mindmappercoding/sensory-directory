// app/api/admin/submissions/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { venueSubmissionSchema } from "@/lib/validators/venueSubmission";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // ✅ normalize images
  const coverImageUrl =
    input.coverImageUrl && input.coverImageUrl.trim().length > 0
      ? input.coverImageUrl.trim()
      : null;

  const imageUrls = (input.imageUrls ?? [])
    .filter((u) => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, 10);

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
        postcode: input.postcode ?? null,
        county: input.county ?? null,

        tags: input.tags,

        // ✅ THIS was missing:
        coverImageUrl,
        imageUrls,

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
