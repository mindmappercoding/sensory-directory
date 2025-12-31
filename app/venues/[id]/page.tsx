import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "./ReviewForm";
import VenueGallery from "./VenueGallery";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  const venue = await prisma.venue.findFirst({
    where: {
      id,
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    include: {
      sensory: true,
      facilities: true,
      reviews: true,
    },
  });

  if (!venue) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold">{venue.name}</h1>

          {!!venue.verifiedAt && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              Verified
            </span>
          )}
        </div>

        <p className="text-muted-foreground">
          {[venue.address1, venue.address2, venue.city, venue.postcode, venue.county]
            .filter(Boolean)
            .join(", ")}
        </p>

        {venue.website && (
          <p>
            <a
              href={venue.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline"
            >
              Visit website
            </a>
          </p>
        )}

        {venue.phone && (
          <p className="text-sm text-muted-foreground">Phone: {venue.phone}</p>
        )}
      </header>

      {/* ✅ NEW: Gallery */}
      <VenueGallery
        venueName={venue.name}
        coverImageUrl={venue.coverImageUrl}
        imageUrls={venue.imageUrls}
      />

      {venue.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-sm leading-relaxed">{venue.description}</p>
        </section>
      )}

      {venue.tags.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <span key={tag} className="rounded-full border px-3 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Sensory information</h2>

        <div className="rounded-xl border p-4 text-sm space-y-2">
          <div>Noise level: {venue.sensory?.noiseLevel ?? "—"}</div>
          <div>Lighting: {venue.sensory?.lighting ?? "—"}</div>
          <div>Crowding: {venue.sensory?.crowding ?? "—"}</div>
          <div>Quiet space: {venue.sensory?.quietSpace ? "Yes" : "No"}</div>
          <div>Sensory hours: {venue.sensory?.sensoryHours ? "Yes" : "No"}</div>

          {venue.sensory?.notes && (
            <div className="pt-2 text-muted-foreground">{venue.sensory.notes}</div>
          )}
        </div>
      </section>

      {venue.facilities && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Facilities</h2>

          <div className="rounded-xl border p-4 text-sm space-y-2">
            <div>Parking: {venue.facilities.parking ? "Yes" : "No"}</div>
            <div>
              Accessible toilet: {venue.facilities.accessibleToilet ? "Yes" : "No"}
            </div>
            <div>Baby change: {venue.facilities.babyChange ? "Yes" : "No"}</div>
            <div>
              Wheelchair access: {venue.facilities.wheelchairAccess ? "Yes" : "No"}
            </div>
            <div>Staff trained: {venue.facilities.staffTrained ? "Yes" : "No"}</div>

            {venue.facilities.notes && (
              <div className="pt-2 text-muted-foreground">{venue.facilities.notes}</div>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Reviews</h2>

        <ReviewForm venueId={venue.id} />

        {venue.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {[...venue.reviews]
              .sort(
                (a, b) =>
                  Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
              )
              .map((r) => (
                <div key={r.id} className="rounded-xl border p-4 text-sm space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium">
                      Rating: {r.rating}/5
                      {r.title ? (
                        <span className="font-normal"> — {r.title}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  {(r.authorName || r.visitTimeHint) && (
                    <div className="text-xs text-muted-foreground">
                      {r.authorName ? <span>By {r.authorName}</span> : null}
                      {r.authorName && r.visitTimeHint ? <span> • </span> : null}
                      {r.visitTimeHint ? <span>Visited: {r.visitTimeHint}</span> : null}
                    </div>
                  )}

                  {r.content && <div className="text-muted-foreground">{r.content}</div>}

                  {(r.noiseLevel ||
                    r.lighting ||
                    r.crowding ||
                    r.quietSpace !== null ||
                    r.sensoryHours !== null) && (
                    <div className="rounded-lg bg-muted/30 p-3 text-xs">
                      <div className="font-medium mb-1">Sensory signals</div>
                      <div className="grid gap-1 sm:grid-cols-2">
                        <div>Noise: {r.noiseLevel ?? "—"}</div>
                        <div>Lighting: {r.lighting ?? "—"}</div>
                        <div>Crowding: {r.crowding ?? "—"}</div>
                        <div>
                          Quiet space:{" "}
                          {r.quietSpace === null ? "—" : r.quietSpace ? "Yes" : "No"}
                        </div>
                        <div>
                          Sensory hours:{" "}
                          {r.sensoryHours === null
                            ? "—"
                            : r.sensoryHours
                            ? "Yes"
                            : "No"}
                        </div>
                      </div>
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
