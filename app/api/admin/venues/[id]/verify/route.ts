import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ REQUIRED

  await prisma.venue.update({
    where: { id },
    data: {
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
