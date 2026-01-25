import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import VenueGallery from "@/app/venues/[id]/VenueGallery";
import HideReviewButton from "./HideReviewButton";
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  Archive,
  Tag,
  Volume2,
  Sun,
  Users,
  Sparkles,
  Car,
  Accessibility,
  Baby,
  UserCheck,
  Calendar,
  User,
  EyeOff,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    typeof (venue as any).avgRating === "number"
      ? (venue as any).avgRating
      : null;

  const isArchived = !!venue.archivedAt;
  const isVerified = !!venue.verifiedAt;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {venue.name}
            </h1>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  <Clock className="h-3 w-3" />
                  Unverified
                </span>
              )}

              {isArchived && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                  <Archive className="h-3 w-3" />
                  Archived
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
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

              {venue.website && (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {venue.website}
                  </a>
                </p>
              )}

              {venue.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {venue.phone}
                </p>
              )}
            </div>

            {/* Review Stats */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {avgRating !== null && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{avgRating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-muted-foreground">
                {visibleCount} visible review{visibleCount === 1 ? "" : "s"}
              </span>
              {hiddenCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-amber-700">
                    {hiddenCount} hidden
                  </span>
                </>
              )}
            </div>
          </div>

          <Link href={`/admin/venues/${id}/edit`}>
            <Button size="lg" className="rounded-2xl">
              <Edit className="mr-2 h-4 w-4" />
              Edit Venue
            </Button>
          </Link>
        </div>
      </div>

      {/* Gallery */}
      <VenueGallery
        venueName={venue.name}
        coverImageUrl={venue.coverImageUrl}
        imageUrls={venue.imageUrls}
      />

      {/* About */}
      {venue.description && (
        <section className="rounded-3xl border bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            About
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {venue.description}
          </p>
        </section>
      )}

      {/* Tags */}
      {venue.tags.length > 0 && (
        <section className="rounded-3xl border bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border bg-primary/5 px-3 py-1 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Sensory */}
      <section className="rounded-3xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Sensory Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-background/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              Noise level
            </div>
            <div className="text-lg font-semibold">
              {venue.sensory?.noiseLevel || "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-background/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sun className="h-3.5 w-3.5" />
              Lighting
            </div>
            <div className="text-lg font-semibold">
              {venue.sensory?.lighting || "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-background/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Crowding
            </div>
            <div className="text-lg font-semibold">
              {venue.sensory?.crowding || "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl bg-background/50 p-3 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            Quiet space: {venue.sensory?.quietSpace ? "Yes" : "No"}
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-background/50 p-3 text-sm">
            <Sun className="h-3.5 w-3.5 text-muted-foreground" />
            Sensory hours: {venue.sensory?.sensoryHours ? "Yes" : "No"}
          </div>
        </div>

        {venue.sensory?.notes && (
          <div className="mt-4 rounded-2xl bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              {venue.sensory.notes}
            </p>
          </div>
        )}
      </section>

      {/* Facilities */}
      {venue.facilities && (
        <section className="rounded-3xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Accessibility className="h-5 w-5 text-primary" />
            Facilities
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              Parking: {venue.facilities.parking ? "Yes" : "No"}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Accessible toilet:{" "}
              {venue.facilities.accessibleToilet ? "Yes" : "No"}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <Baby className="h-3.5 w-3.5 text-muted-foreground" />
              Baby change: {venue.facilities.babyChange ? "Yes" : "No"}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Wheelchair access:{" "}
              {venue.facilities.wheelchairAccess ? "Yes" : "No"}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Staff trained: {venue.facilities.staffTrained ? "Yes" : "No"}
            </div>
          </div>
          {venue.facilities.notes && (
            <div className="mt-4 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                {venue.facilities.notes}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Reviews */}
      <section className="rounded-3xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Star className="h-5 w-5 text-primary" />
          Reviews
        </h2>

        {venue.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {venue.reviews.map((r) => {
              const isHidden = !!r.hiddenAt;

              return (
                <div
                  key={r.id}
                  className={[
                    "rounded-2xl border p-5 transition-all",
                    isHidden && "border-amber-200 bg-amber-50/50 opacity-75",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold">
                            {r.rating}/5
                          </span>
                        </div>
                        {isHidden && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </span>
                        )}
                      </div>

                      {r.title && (
                        <h4 className="font-semibold">{r.title}</h4>
                      )}
                      {r.content && (
                        <p className="text-sm text-muted-foreground">
                          {r.content}
                        </p>
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
    </div>
  );
}