import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import Link from "next/link";

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
    <main className="space-y-5">
      {/* Banner / Hero */}
      <section className="rounded-3xl border bg-card/60 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-400/10 blur-2xl" />

        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Find sensory-friendly venues
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Search by venue name, filter by features, and discover places that feel
            calmer, kinder, and more predictable for families.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background/70 px-3 py-1">
              {venues.length} results
            </span>
            <span className="rounded-full border bg-background/70 px-3 py-1">
              Verified venues float to the top
            </span>
            <span className="rounded-full border bg-background/70 px-3 py-1">
              Filters update instantly
            </span>
          </div>
        </div>
      </section>

      {/* 2-column layout */}
      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Left: Filters */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <VenueFilters />
        </aside>

        {/* Right: Results (scroll container on desktop) */}
        <div className="rounded-3xl border bg-card/40">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b">
            <div>
              <div className="text-sm font-semibold">Venues</div>
              <div className="text-xs text-muted-foreground">
                Click a venue to view details & reviews.
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing up to 50
            </div>
          </div>

          {/* Limited scrolling happens inside this panel */}
          <div className="max-h-[calc(100dvh-18.5rem)] overflow-auto">
            {venues.length === 0 ? (
              <div className="p-6">
                <div className="rounded-2xl border bg-background/60 p-5">
                  <div className="text-sm font-medium">No matches found</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Try clearing one filter or searching a shorter venue name.
                  </div>
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {venues.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/venues/${v.id}`}
                      className="block px-5 py-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{v.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {[v.city, v.postcode].filter(Boolean).join(" • ")}
                          </div>

                          {!!v.tags?.length && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {v.tags.slice(0, 5).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full border bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                              {v.tags.length > 5 && (
                                <span className="text-[11px] text-muted-foreground">
                                  +{v.tags.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {!!v.verifiedAt && (
                          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                            Verified
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
