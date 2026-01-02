import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const status = body?.status as "RESOLVED" | "DISMISSED" | undefined;

    if (!status || !["RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    // 🔹 First, check the report actually exists
    const existing = await prisma.reviewReport.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      // This is the "No record was found for an update" case you were seeing
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.reviewReport.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolutionNote:
          typeof body?.resolutionNote === "string"
            ? body.resolutionNote
            : null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, report: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
