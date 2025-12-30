// app/api/admin/submissions/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const submission = await prisma.venueSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (submission.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot reject submission in status ${submission.status}` },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({} as any));
  const reason =
    typeof body?.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim()
      : null;

  await prisma.venueSubmission.update({
    where: { id: submission.id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      // reviewedBy: "admin", // set from auth (see below)
      rejectionReason: reason,
    },
  });

  return NextResponse.json({ ok: true });
}
