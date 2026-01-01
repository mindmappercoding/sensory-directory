// app/admin/venues/page.tsx
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ArchiveVenueButton } from "./ArchiveVenueButton";
import { VerifyVenueButton } from "./VerifyVenueButton";
import { UnarchiveVenueButton } from "./UnarchiveVenueButton";

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
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All venues</h1>
        <Link href="/admin" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

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

          return (
            <div
              key={v.id}
              className={[
                "relative overflow-hidden rounded-2xl border bg-card",
                archived && "bg-red-50 border-red-200 opacity-90",
              ].join(" ")}
            >
              {archived && (
                <span className="absolute top-2 right-2 z-10 rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                  Archived
                </span>
              )}

              <div className="flex flex-col sm:flex-row">
                <div className="relative h-40 w-full sm:h-28 sm:w-44 shrink-0">
                  <Image
                    src={thumb}
                    alt={v.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 176px"
                  />
                </div>

                <div className="flex-1 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {[v.city, v.postcode].filter(Boolean).join(" • ")}
                    </p>

                    <div className="mt-1 text-xs space-x-2">
                      {v.verifiedAt ? (
                        <span className="text-emerald-600">Verified</span>
                      ) : (
                        <span className="text-amber-600">Unverified</span>
                      )}
                      <span>•</span>
                      <span>
                        {avgRating === null
                          ? "No ratings"
                          : `${avgRating.toFixed(1)} ★ avg`}
                      </span>
                      <span>•</span>
                      <span>
                        {reviewCount} review{reviewCount === 1 ? "" : "s"}
                      </span>
                      {hiddenCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700">
                            {hiddenCount} hidden
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {(v.imageUrls?.length ?? 0) + (v.coverImageUrl ? 1 : 0)}{" "}
                        images
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    <Link
                      href={`/admin/venues/${v.id}`}
                      className="rounded-lg border px-3 py-1 text-sm"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/venues/${v.id}/edit`}
                      className="rounded-lg border px-3 py-1 text-sm"
                    >
                      Edit
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
      </div>
    </main>
  );
}
