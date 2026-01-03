// app/venues/page.tsx
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function normPostcode(pc: string) {
  return pc.trim().toUpperCase().replace(/\s+/g, " ");
}

async function geocodeUKPostcode(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const pc = normPostcode(postcode);
  if (!pc) return null;

  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    result?: { latitude: number | null; longitude: number | null } | null;
  };

  const lat = json?.result?.latitude ?? null;
  const lng = json?.result?.longitude ?? null;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371e3; // metres
  const toRad = (d: number) => (d * Math.PI) / 180;

  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);

  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

async function mapWithLimit<T, U>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<U>
): Promise<U[]> {
  const out: U[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return out;
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const near = typeof sp.near === "string" ? sp.near : "";

  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;

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

    noiseLevel:
      typeof sp.noiseLevel === "string" ? (sp.noiseLevel as any) : undefined,
    lighting: typeof sp.lighting === "string" ? (sp.lighting as any) : undefined,
    crowding: typeof sp.crowding === "string" ? (sp.crowding as any) : undefined,

    // if "nearest" is active, we sort here (not inside listVenues)
    sort:
      sortParam && sortParam !== "nearest"
        ? (sortParam as any)
        : undefined,
  };

  const baseVenues = await listVenues(filters);

  let venues: any[] = baseVenues;
  let origin: { lat: number; lng: number } | null = null;
  let nearError: string | null = null;

  if (near.trim()) {
    origin = await geocodeUKPostcode(near);
    if (!origin) {
      nearError = `We couldn't find that postcode, so we're showing the default ordering.`;
    } else {
      // per-request cache so we don't look up the same venue postcode repeatedly
      const venuePcCache = new Map<string, { lat: number; lng: number } | null>();

      async function coordsForVenue(v: any) {
        // prefer stored coords
        if (typeof v.lat === "number" && typeof v.lng === "number") {
          return { lat: v.lat, lng: v.lng };
        }

        // fallback: geocode the venue postcode (works even if lat/lng not selected by listVenues)
        const pc = typeof v.postcode === "string" ? v.postcode : "";
        const key = pc ? normPostcode(pc) : "";
        if (!key) return null;

        if (venuePcCache.has(key)) return venuePcCache.get(key)!;

        const geo = await geocodeUKPostcode(key);
        venuePcCache.set(key, geo);
        return geo;
      }

      const enriched = await mapWithLimit(baseVenues, 6, async (v: any) => {
        const coords = await coordsForVenue(v);
        const distanceMeters = coords ? haversineMeters(origin!, coords) : null;
        return { ...v, distanceMeters };
      });

      venues = enriched.sort((a, b) => {
        const da = typeof a.distanceMeters === "number" ? a.distanceMeters : Infinity;
        const db = typeof b.distanceMeters === "number" ? b.distanceMeters : Infinity;
        return da - db;
      });
    }
  }

  const nearLabel = near.trim() ? normPostcode(near) : "";

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
                {origin && nearLabel ? ` • Nearest to ${nearLabel}` : ""}
              </div>
              {nearError && (
                <div className="mt-1 text-xs text-amber-700">
                  {nearError}
                </div>
              )}
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

                const km =
                  typeof v.distanceMeters === "number"
                    ? v.distanceMeters / 1000
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
                            {km !== null && (
                              <span> • {km.toFixed(1)} km</span>
                            )}
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
