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

    const updated = await prisma.reviewReport.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolutionNote: typeof body?.resolutionNote === "string" ? body.resolutionNote : null,
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
