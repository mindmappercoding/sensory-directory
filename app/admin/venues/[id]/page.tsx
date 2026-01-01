// app/admin/venues/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VenueGallery from "@/app/venues/[id]/VenueGallery";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  // --- Server Actions (hide/restore) ---
  async function hideReview(formData: FormData) {
    "use server";
    const reviewId = String(formData.get("reviewId") || "");
    const venueId = String(formData.get("venueId") || "");
    if (!reviewId || !venueId) return;

    await prisma.$transaction(async (tx) => {
      // If already hidden, do nothing
      const existing = await tx.review.findUnique({
        where: { id: reviewId },
        select: { hiddenAt: true },
      });
      if (existing?.hiddenAt) return;

      await tx.review.update({
        where: { id: reviewId },
        data: { hiddenAt: new Date() },
      });

      // Keep Venue.reviewCount in sync (only counts visible reviews)
      await tx.venue.update({
        where: { id: venueId },
        data: {
          reviewCount: { decrement: 1 },
          lastReviewedAt: new Date(),
        },
      });
    });

    revalidatePath(`/admin/venues/${venueId}`);
  }

  async function restoreReview(formData: FormData) {
    "use server";
    const reviewId = String(formData.get("reviewId") || "");
    const venueId = String(formData.get("venueId") || "");
    if (!reviewId || !venueId) return;

    await prisma.$transaction(async (tx) => {
      // If already visible, do nothing
      const existing = await tx.review.findUnique({
        where: { id: reviewId },
        select: { hiddenAt: true },
      });
      if (!existing?.hiddenAt) return;

      await tx.review.update({
        where: { id: reviewId },
        data: { hiddenAt: null },
      });

      // Keep Venue.reviewCount in sync
      await tx.venue.update({
        where: { id: venueId },
        data: {
          reviewCount: { increment: 1 },
          lastReviewedAt: new Date(),
        },
      });
    });

    revalidatePath(`/admin/venues/${venueId}`);
  }

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      sensory: true,
      facilities: true,
      submissions: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorName: true,
          authorId: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          hiddenAt: true, // ✅ new
        },
      },
    },
  });

  if (!venue) return notFound();

  const visibleReviews = venue.reviews.filter(
    (r) => !r.hiddenAt
  );
  const hiddenReviews = venue.reviews.filter(
    (r) => !!r.hiddenAt
  );

  const reviewCount = visibleReviews.length;
  const avgRating =
    reviewCount > 0
      ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

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

        {/* ✅ Avg rating + review count (VISIBLE only) */}
        <p className="text-sm text-muted-foreground">
          {avgRating === null
            ? "No reviews yet."
            : `${avgRating.toFixed(1)} ★ • ${reviewCount} review${
                reviewCount === 1 ? "" : "s"
              }`}
          {hiddenReviews.length > 0 ? (
            <span className="ml-2">
              • <span className="text-amber-700">{hiddenReviews.length} hidden</span>
            </span>
          ) : null}
        </p>

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

      {/* ✅ Gallery */}
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

      {/* ✅ Visible reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Reviews</h2>

        {visibleReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visible reviews.</p>
        ) : (
          <div className="space-y-3">
            {visibleReviews.map((r) => (
              <div key={r.id} className="rounded-xl border p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Rating: {r.rating}/5</div>
                    <div className="text-xs text-muted-foreground">
                      {r.authorName || "Anonymous"} •{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <form action={hideReview}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="venueId" value={venue.id} />
                    <button className="rounded-lg border px-3 py-1 text-sm">
                      Hide
                    </button>
                  </form>
                </div>

                {r.title && <div className="mt-2">{r.title}</div>}
                {r.content && (
                  <div className="mt-2 text-muted-foreground">{r.content}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ✅ Hidden reviews */}
      {hiddenReviews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-amber-700">
            Hidden reviews
          </h2>

          <div className="space-y-3">
            {hiddenReviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Rating: {r.rating}/5{" "}
                      <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-900">
                        Hidden
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.authorName || "Anonymous"} •{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <form action={restoreReview}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="venueId" value={venue.id} />
                    <button className="rounded-lg border px-3 py-1 text-sm">
                      Restore
                    </button>
                  </form>
                </div>

                {r.title && <div className="mt-2">{r.title}</div>}
                {r.content && (
                  <div className="mt-2 text-muted-foreground">{r.content}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
