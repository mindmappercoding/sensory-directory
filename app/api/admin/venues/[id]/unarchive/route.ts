import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.venue.update({
    where: { id },
    data: { archivedAt: null },
  });

  return NextResponse.json({ ok: true });
}
