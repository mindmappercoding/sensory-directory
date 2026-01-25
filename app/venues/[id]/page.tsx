// app/venues/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "./ReviewForm";
import VenueGallery from "./VenueGallery";
import ReportReviewButton from "./ReportReviewButton";
import {
  MapPin,
  Globe,
  Phone,
  Star,
  Volume2,
  Sun,
  Users,
  Sparkles,
  CheckCircle2,
  Wifi,
  Accessibility,
  Baby,
  Car,
  UserCheck,
  Calendar,
  User,
} from "lucide-react";

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
      reviews: {
        where: { OR: [{ hiddenAt: null }, { hiddenAt: { isSet: false } }] },
      },
    },
  });

  if (!venue) return notFound();

  const reviewCount = venue.reviews.length;
  const avgRating =
    reviewCount > 0
      ? venue.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return (
    <main className="space-y-8 py-6">
      {/* Hero Section */}
      <section className="space-y-4">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {venue.name}
            </h1>

            {/* Location */}
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm sm:text-base">
                {[
                  venue.address1,
                  venue.address2,
                  venue.city,
                  venue.postcode,
                  venue.county,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {/* Reviews */}
            <div className="mt-3 flex items-center gap-4">
              {reviewCount > 0 && avgRating !== null ? (
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-semibold">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No reviews yet
                </span>
              )}
            </div>
          </div>

          {/* Verified Badge */}
          {!!venue.verifiedAt && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Globe className="h-4 w-4" />
              Visit website
            </a>
          )}

          {venue.phone && (
            <a
              href={`tel:${venue.phone}`}
              className="inline-flex items-center gap-2 rounded-2xl border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4" />
              {venue.phone}
            </a>
          )}
        </div>
      </section>

      {/* Gallery */}
      <VenueGallery
        venueName={venue.name}
        coverImageUrl={venue.coverImageUrl}
        imageUrls={venue.imageUrls}
      />

      {/* About & Tags */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* About - spans 2 columns */}
        {venue.description && (
          <section className="lg:col-span-2">
            <div className="rounded-3xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                About this venue
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {venue.description}
              </p>
            </div>
          </section>
        )}

        {/* Tags */}
        {venue.tags.length > 0 && (
          <section
            className={venue.description ? "" : "lg:col-span-3"}
          >
            <div className="rounded-3xl border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sensory Information */}
      <section>
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Sensory information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <Volume2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Noise level</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {venue.sensory?.noiseLevel ?? "Not specified"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <Sun className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Lighting</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {venue.sensory?.lighting ?? "Not specified"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Crowding</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {venue.sensory?.crowding ?? "Not specified"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Quiet space</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {venue.sensory?.quietSpace ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
              <Sun className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Sensory hours</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {venue.sensory?.sensoryHours ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>

          {venue.sensory?.notes && (
            <div className="mt-4 rounded-2xl bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {venue.sensory.notes}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Facilities */}
      {venue.facilities && (
        <section>
          <div className="rounded-3xl border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Accessibility className="h-5 w-5 text-primary" />
              Facilities & accessibility
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <Car
                  className={`h-5 w-5 ${venue.facilities.parking ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="text-sm font-medium">Parking</div>
                  <div className="text-xs text-muted-foreground">
                    {venue.facilities.parking ? "Available" : "Not available"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <Accessibility
                  className={`h-5 w-5 ${venue.facilities.accessibleToilet ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="text-sm font-medium">Accessible toilet</div>
                  <div className="text-xs text-muted-foreground">
                    {venue.facilities.accessibleToilet
                      ? "Available"
                      : "Not available"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <Baby
                  className={`h-5 w-5 ${venue.facilities.babyChange ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="text-sm font-medium">Baby change</div>
                  <div className="text-xs text-muted-foreground">
                    {venue.facilities.babyChange
                      ? "Available"
                      : "Not available"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <Accessibility
                  className={`h-5 w-5 ${venue.facilities.wheelchairAccess ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="text-sm font-medium">Wheelchair access</div>
                  <div className="text-xs text-muted-foreground">
                    {venue.facilities.wheelchairAccess
                      ? "Available"
                      : "Not available"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <UserCheck
                  className={`h-5 w-5 ${venue.facilities.staffTrained ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="text-sm font-medium">Trained staff</div>
                  <div className="text-xs text-muted-foreground">
                    {venue.facilities.staffTrained ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>

            {venue.facilities.notes && (
              <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {venue.facilities.notes}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section>
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <Star className="h-5 w-5 text-primary" />
            Reviews ({reviewCount})
          </h2>

          <ReviewForm venueId={venue.id} />

          {venue.reviews.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-muted/30 p-8 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {[...venue.reviews]
                .sort(
                  (a, b) =>
                    Number(new Date(b.createdAt)) -
                    Number(new Date(a.createdAt))
                )
                .map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border bg-background p-5 transition-shadow hover:shadow-md"
                  >
                    {/* Review Header */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">
                            {r.rating}/5
                          </span>
                        </div>
                        {r.title && (
                          <h3 className="font-medium">{r.title}</h3>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Author & Visit Info */}
                    {(r.authorName || r.visitTimeHint) && (
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {r.authorName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {r.authorName}
                          </span>
                        )}
                        {r.visitTimeHint && (
                          <span className="flex items-center gap-1">
                            {r.authorName && <span>•</span>}
                            Visited: {r.visitTimeHint}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Review Content */}
                    {r.content && (
                      <p className="mb-4 leading-relaxed text-muted-foreground">
                        {r.content}
                      </p>
                    )}

                    {/* Sensory Signals */}
                    {(r.noiseLevel ||
                      r.lighting ||
                      r.crowding ||
                      r.quietSpace !== null ||
                      r.sensoryHours !== null) && (
                      <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Sensory details
                        </div>
                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          {r.noiseLevel && (
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Noise: {r.noiseLevel}
                              </span>
                            </div>
                          )}
                          {r.lighting && (
                            <div className="flex items-center gap-2">
                              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Lighting: {r.lighting}
                              </span>
                            </div>
                          )}
                          {r.crowding && (
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Crowding: {r.crowding}
                              </span>
                            </div>
                          )}
                          {r.quietSpace !== null && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Quiet space: {r.quietSpace ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                          {r.sensoryHours !== null && (
                            <div className="flex items-center gap-2">
                              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Sensory hours: {r.sensoryHours ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                        </div>
                        <ReportReviewButton reviewId={r.id} />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}