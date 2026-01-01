import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewReportSchema } from "@/lib/validators/review-report";
import { auth } from "@/lib/auth";

function getIp(req: Request) {
  // Vercel / proxies
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const body = await req.json();
    const parsed = reviewReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please fix the report fields." },
        { status: 400 }
      );
    }

    const session = await auth();
    const reporterId = session?.user?.id ?? null;
    const reporterIp = getIp(req);

    // Must exist
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, venueId: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    await prisma.reviewReport.create({
      data: {
        reviewId: review.id,
        venueId: review.venueId,
        reporterId,
        reporterIp: reporterIp ?? undefined,
        reason: parsed.data.reason,
        message: parsed.data.message ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
