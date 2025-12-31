// app/venues/page.tsx
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function parseTagsParam(val: unknown): string[] | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  const tags = val
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    city: typeof sp.city === "string" ? sp.city : undefined,
    tags: parseTagsParam(sp.tags),
    sensoryHours:
      typeof sp.sensoryHours === "string"
        ? (sp.sensoryHours as "true" | "false")
        : undefined,
    quietSpace:
      typeof sp.quietSpace === "string"
        ? (sp.quietSpace as "true" | "false")
        : undefined,
  };

  const venues = await listVenues(filters);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[calc(100dvh-4rem)]">
      {/* Layout uses full viewport height */}
      <div className="flex h-full flex-col gap-6">
        {/* Banner */}
        <section className="relative shrink-0 overflow-hidden rounded-3xl border bg-card">
          <div className="absolute inset-0 opacity-[0.35]">
            <div className="h-full w-full bg-gradient-to-br from-sky-200/60 via-transparent to-blue-100/60" />
          </div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Sensory-friendly venues
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Find places that work well for children with sensory needs —
                  calm environments, sensory hours, and family-friendly spaces.
                </p>
              </div>

              <Link href="/submit" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Submit a venue
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Content area fills remaining height */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[360px_1fr] min-h-0">
          {/* Filters (never scroll) */}
          <aside className="shrink-0">
            <VenueFilters />
          </aside>

          {/* Results panel (ONLY scrollable area) */}
          <section className="relative min-h-0 rounded-3xl border bg-card">
            {/* Header stays fixed */}
            <div className="shrink-0 border-b px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Venues</div>
                  <div className="text-xs text-muted-foreground">
                    Scroll inside this panel to browse results
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {venues.length} results
                </div>
              </div>
            </div>

            {/* SCROLL CONTAINER */}
            <div className="absolute inset-x-0 bottom-0 top-[72px] overflow-y-auto overscroll-contain">
              <div className="space-y-3 p-4">
                {venues.length === 0 ? (
                  <div className="rounded-2xl border bg-background/60 p-6 text-center">
                    <div className="text-base font-medium">No venues found</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your filters or searching a shorter name.
                    </div>
                  </div>
                ) : (
                  venues.map((v) => {
                    const src = (v as any).coverImageUrl || "/600x400.png";

                    return (
                      <Link
                        key={v.id}
                        href={`/venues/${v.id}`}
                        className="group block overflow-hidden rounded-2xl border bg-background hover:bg-muted/30 transition"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative h-44 w-full sm:h-36 sm:w-56 shrink-0">
                            <Image
                              src={src}
                              alt={v.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 224px"
                            />
                          </div>

                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-base sm:text-lg truncate">
                                  {v.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {[v.city, v.postcode]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </div>
                              </div>

                              {!!v.verifiedAt && (
                                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                  Verified
                                </span>
                              )}
                            </div>

                            {!!v.tags?.length && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {v.tags.slice(0, 6).join(" · ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
