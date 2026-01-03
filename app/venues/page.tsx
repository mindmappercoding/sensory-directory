// app/venues/page.tsx
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    city: typeof sp.city === "string" ? sp.city : undefined,
    tags:
      typeof sp.tags === "string"
        ? sp.tags.split(",").filter(Boolean)
        : undefined,

    sensoryHours:
      typeof sp.sensoryHours === "string"
        ? (sp.sensoryHours as "true" | "false")
        : undefined,
    quietSpace:
      typeof sp.quietSpace === "string"
        ? (sp.quietSpace as "true" | "false")
        : undefined,

    noiseLevel: typeof sp.noiseLevel === "string" ? (sp.noiseLevel as any) : undefined,
    lighting: typeof sp.lighting === "string" ? (sp.lighting as any) : undefined,
    crowding: typeof sp.crowding === "string" ? (sp.crowding as any) : undefined,

    sort: typeof sp.sort === "string" ? (sp.sort as any) : undefined,
  };

  const venues = await listVenues(filters);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* FULL-WIDTH BANNER */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Sensory-friendly venues
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Calm, inclusive places designed to support children and families
              with sensory needs.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER BAR (full width, navbar-style) */}
      <section className="sticky top-14 z-40">
        <div className="rounded-3xl border bg-background/80 backdrop-blur">
          <div className="p-3 sm:p-4">
            <VenueFilters variant="bar" resultsCount={venues.length} />
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="rounded-3xl border bg-card">
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Venues</div>
              <div className="text-xs text-muted-foreground">
                {venues.length} results
              </div>
            </div>

            <Link href="/submit" className="hidden sm:block">
              <Button className="rounded-xl">Submit a venue</Button>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {venues.length === 0 ? (
            <div className="rounded-2xl border bg-background/60 p-6 text-center">
              <div className="text-base font-medium">No venues found</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or searching a shorter name.
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {venues.map((v: any) => {
                const src = v.coverImageUrl || "/600x400.png";
                const hasReviews = (v.reviewCount ?? 0) > 0;
                const avg = typeof v.avgRating === "number" ? v.avgRating : null;

                const added =
                  v.createdAt
                    ? new Date(v.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                return (
                  <Link
                    key={v.id}
                    href={`/venues/${v.id}`}
                    className="group block overflow-hidden rounded-3xl border bg-background hover:bg-muted/30 transition"
                  >
                    <div className="relative h-56 w-full">
                      <Image
                        src={src}
                        alt={v.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {!!v.verifiedAt && (
                        <span className="absolute left-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-lg sm:text-xl font-semibold truncate">
                            {v.name}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {[v.city, v.postcode].filter(Boolean).join(" • ")}
                          </div>

                          {/* ✅ Added date */}
                          {added && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Added {added}
                            </div>
                          )}

                          <div className="mt-2 text-xs text-muted-foreground">
                            {hasReviews && avg !== null ? (
                              <span>
                                ★ {avg.toFixed(1)} · {v.reviewCount}{" "}
                                {v.reviewCount === 1 ? "review" : "reviews"}
                              </span>
                            ) : (
                              <span>No reviews yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!!v.tags?.length && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          {v.tags.slice(0, 8).join(" · ")}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
