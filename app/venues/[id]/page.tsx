// app/venues/[id]/page.tsx
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
    include: {
      sensory: true,
      facilities: true,
      reviews: true,
    },
  });

  if (!venue) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold">{venue.name}</h1>

        <p className="mt-2 text-muted-foreground">
          {[venue.address1, venue.address2, venue.city, venue.postcode, venue.county]
            .filter(Boolean)
            .join(", ")}
        </p>

        {venue.website && (
          <p className="mt-2">
            <a
              href={venue.website}
              target="_blank"
              className="text-sm underline"
              rel="noreferrer"
            >
              Visit website
            </a>
          </p>
        )}

        {venue.phone && (
          <p className="text-sm text-muted-foreground mt-1">
            Phone: {venue.phone}
          </p>
        )}
      </header>

      {/* Description */}
      {venue.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-sm leading-relaxed">{venue.description}</p>
        </section>
      )}

      {/* Tags */}
      {venue.tags.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Sensory Profile */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Sensory information</h2>

        <div className="rounded-xl border p-4 text-sm space-y-2">
          <div>Noise level: {venue.sensory?.noiseLevel ?? "—"}</div>
          <div>Lighting: {venue.sensory?.lighting ?? "—"}</div>
          <div>Crowding: {venue.sensory?.crowding ?? "—"}</div>
          <div>
            Quiet space: {venue.sensory?.quietSpace ? "Yes" : "No"}
          </div>
          <div>
            Sensory hours: {venue.sensory?.sensoryHours ? "Yes" : "No"}
          </div>

          {venue.sensory?.notes && (
            <div className="pt-2 text-muted-foreground">
              {venue.sensory.notes}
            </div>
          )}
        </div>
      </section>

      {/* Facilities */}
      {venue.facilities && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Facilities</h2>

          <div className="rounded-xl border p-4 text-sm space-y-2">
            <div>Parking: {venue.facilities.parking ? "Yes" : "No"}</div>
            <div>
              Accessible toilet:{" "}
              {venue.facilities.accessibleToilet ? "Yes" : "No"}
            </div>
            <div>Baby change: {venue.facilities.babyChange ? "Yes" : "No"}</div>
            <div>
              Wheelchair access:{" "}
              {venue.facilities.wheelchairAccess ? "Yes" : "No"}
            </div>
            <div>
              Staff trained: {venue.facilities.staffTrained ? "Yes" : "No"}
            </div>

            {venue.facilities.notes && (
              <div className="pt-2 text-muted-foreground">
                {venue.facilities.notes}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Reviews</h2>

        {venue.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-3">
            {venue.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border p-4 text-sm">
                <div className="font-medium">Rating: {r.rating}/5</div>
                {r.title && <div className="mt-1">{r.title}</div>}
                {r.content && (
                  <div className="mt-2 text-muted-foreground">
                    {r.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
