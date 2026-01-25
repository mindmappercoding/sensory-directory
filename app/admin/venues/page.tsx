// app/admin/venues/page.tsx
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ArchiveVenueButton } from "./ArchiveVenueButton";
import { VerifyVenueButton } from "./VerifyVenueButton";
import { UnarchiveVenueButton } from "./UnarchiveVenueButton";
import {
  Building2,
  MapPin,
  Star,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  ImageIcon,
  EyeOff,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reviews: {
        select: { rating: true, hiddenAt: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Venues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all venues in the directory
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{venues.length} total</span>
        </div>
      </div>

      {/* Venues List */}
      <div className="space-y-4">
        {venues.map((v) => {
          const archived = !!v.archivedAt;
          const thumb = v.coverImageUrl || v.imageUrls?.[0] || "/600x400.png";

          const hiddenCount = v.reviews.filter(
            (r) => r.hiddenAt !== null && r.hiddenAt !== undefined
          ).length;

          const visibleReviews = v.reviews.filter(
            (r) => r.hiddenAt === null || r.hiddenAt === undefined
          );

          const reviewCount = visibleReviews.length;
          const avgRating =
            reviewCount > 0
              ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) /
                reviewCount
              : null;

          const imageCount =
            (v.imageUrls?.length ?? 0) + (v.coverImageUrl ? 1 : 0);

          return (
            <div
              key={v.id}
              className={[
                "group relative overflow-hidden rounded-3xl border bg-card transition-all hover:shadow-md",
                archived && "border-red-200 bg-red-50/50 opacity-80",
              ].join(" ")}
            >
              {/* Archived Badge */}
              {archived && (
                <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  <Archive className="h-3 w-3" />
                  Archived
                </div>
              )}

              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-32 sm:w-48">
                  <Image
                    src={thumb}
                    alt={v.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                  
                  {/* Image Count Badge */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                    <ImageIcon className="h-3 w-3" />
                    {imageCount}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {/* Title & Location */}
                    <div className="mb-3">
                      <h3 className="mb-1 text-lg font-semibold">{v.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {[v.city, v.postcode].filter(Boolean).join(", ")}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {/* Verification Status */}
                      {v.verifiedAt ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Unverified</span>
                        </div>
                      )}

                      {/* Rating */}
                      {avgRating !== null && (
                        <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Review Count */}
                      <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {reviewCount} review{reviewCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Hidden Reviews */}
                      {hiddenCount > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                          <EyeOff className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            {hiddenCount} hidden
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/admin/venues/${v.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>

                    <Link href={`/admin/venues/${v.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                      >
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>

                    {archived ? (
                      <UnarchiveVenueButton id={v.id} />
                    ) : (
                      <>
                        <VerifyVenueButton
                          id={v.id}
                          verified={!!v.verifiedAt}
                        />
                        <ArchiveVenueButton id={v.id} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {venues.length === 0 && (
          <div className="rounded-3xl border bg-card p-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No venues yet</h3>
            <p className="text-sm text-muted-foreground">
              Venues will appear here once they're added to the directory
            </p>
          </div>
        )}
      </div>
    </div>
  );
}