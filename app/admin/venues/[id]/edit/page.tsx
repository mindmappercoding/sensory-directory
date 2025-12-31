import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminVenueEditForm from "./AdminVenueEditForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenueEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { sensory: true, facilities: true },
  });

  if (!venue) return notFound();

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit venue</h1>
        <p className="text-sm text-muted-foreground">
          Changes save immediately and affect the public listing (unless archived).
        </p>
      </div>

      <AdminVenueEditForm venue={venue} />
    </main>
  );
}
