import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminVenueEditForm from "./AdminVenueEditForm";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Venue</h1>
            <p className="text-sm text-muted-foreground">
              Changes save immediately and affect the public listing
            </p>
          </div>
        </div>
        <Link href={`/admin/venues/${id}`}>
          <Button variant="outline" size="sm" className="rounded-2xl">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to venue
          </Button>
        </Link>
      </div>

      <AdminVenueEditForm venue={venue} />
    </div>
  );
}