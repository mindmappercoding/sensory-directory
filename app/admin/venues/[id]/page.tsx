import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VenueGallery from "@/app/venues/[id]/VenueGallery";
import HideReviewButton from "./HideReviewButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenueDetailPage({
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
      reviews: { orderBy: { createdAt: "desc" } },
      submissions: true,
    },
  });

  if (!venue) return notFound();

  const visibleCount =
    (venue as any).visibleReviewCount ??
    venue.reviewCount ??
    venue.reviews.filter((r) => !r.hiddenAt).length;

  const hiddenCount =
    (venue as any).hiddenReviewCount ??
    venue.reviews.filter((r) => !!r.hiddenAt).length;

  const avgRating =
    typeof (venue as any).avgRating === "number" ? (venue as any).avgRating : null;

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{venue.name}</h1>

        <div className="text-xs space-x-2">
          {venue.verifiedAt ? (
            <span className="text-emerald-600">Verified</span>
          ) : (
            <span className="text-amber-600">Unverified</span>
          )}
          {venue.archivedAt && <span className="text-red-600">Archived</span>}
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

        {/* ✅ Review stats (back like before) */}
        <div className="pt-2 text-sm">
          <span className="font-medium">
            {avgRating === null ? "No ratings yet" : `${avgRating.toFixed(1)} ★ avg`}
          </span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span>
            {visibleCount} visible review{visibleCount === 1 ? "" : "s"}
          </span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {hiddenCount} hidden
          </span>
        </div>
      </header>

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

        {venue.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {venue.reviews.map((r) => {
              const isHidden = !!r.hiddenAt;

              return (
                <div
                  key={r.id}
                  className={[
                    "rounded-xl border p-4 text-sm",
                    isHidden ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        Rating: {r.rating}/5{" "}
                        {isHidden && (
                          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            Hidden
                          </span>
                        )}
                      </div>
                      {r.title && <div className="mt-1">{r.title}</div>}
                      {r.content && (
                        <div className="mt-2 text-muted-foreground">{r.content}</div>
                      )}
                    </div>

                    <HideReviewButton reviewId={r.id} isHidden={isHidden} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
