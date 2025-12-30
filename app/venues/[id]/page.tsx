import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) return notFound();

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { sensory: true, facilities: true, reviews: true },
  });

  if (!venue) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{venue.name}</h1>

      <p className="mt-2 text-muted-foreground">
        {[venue.city, venue.postcode].filter(Boolean).join(" • ")}
      </p>

      {venue.description && <p className="mt-4">{venue.description}</p>}

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Sensory</h2>
        <div className="rounded-xl border p-4 text-sm">
          <div>Noise: {venue.sensory?.noiseLevel ?? "—"}</div>
          <div>Lighting: {venue.sensory?.lighting ?? "—"}</div>
          <div>Crowding: {venue.sensory?.crowding ?? "—"}</div>
          <div className="mt-2">
            Quiet space: {String(venue.sensory?.quietSpace ?? "—")}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="space-y-3">
          {venue.reviews.map((r) => (
            <div key={r.id} className="rounded-xl border p-4 text-sm">
              <div className="font-medium">Rating: {r.rating}/5</div>
              {r.title && <div className="mt-1">{r.title}</div>}
              {r.content && (
                <div className="mt-2 text-muted-foreground">{r.content}</div>
              )}
            </div>
          ))}
          {venue.reviews.length === 0 && (
            <div className="text-sm text-muted-foreground">No reviews yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
