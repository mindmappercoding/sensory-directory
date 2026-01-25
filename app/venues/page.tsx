// app/venues/page.tsx
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Calendar, CheckCircle2 } from "lucide-react";

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
    <main className="space-y-6 py-6">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/20 p-8 sm:p-10">
        <div className="relative z-10 max-w-3xl">
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Sensory-friendly venues
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Discover calm, inclusive places designed to support children and families
            with sensory needs. Filter by location, sensory features, and more.
          </p>
        </div>
        {/* Decorative gradient blob */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      </section>

      {/* FILTER BAR */}
      <section className="sticky top-14 z-40">
        <div className="rounded-3xl border bg-background/95 shadow-lg backdrop-blur-sm">
          <div className="p-4 sm:p-5">
            <VenueFilters variant="bar" resultsCount={venues.length} />
          </div>
        </div>
      </section>

      {/* RESULTS HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {venues.length} {venues.length === 1 ? "venue" : "venues"} found
          </h2>
          {origin && nearLabel && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Nearest to {nearLabel}
            </p>
          )}
          {nearError && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-600">
              <span className="text-base">⚠️</span>
              {nearError}
            </p>
          )}
        </div>

        <Link href="/submit">
          <Button size="lg" className="h-12 rounded-2xl px-6">
            Submit a venue
          </Button>
        </Link>
      </div>

      {/* RESULTS GRID */}
      <section>
        {venues.length === 0 ? (
          <div className="rounded-3xl border bg-card p-12 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No venues found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or searching with different keywords.
                We're always adding new venues!
              </p>
              <Link href="/submit" className="inline-block pt-2">
                <Button variant="outline" className="rounded-2xl">
                  Submit the first venue
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group block overflow-hidden rounded-3xl border bg-card transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <Image
                      src={src}
                      alt={v.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {!!v.verifiedAt && (
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1.5 text-xs font-medium text-emerald-700 backdrop-blur-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-primary">
                          {v.name}
                        </h3>
                        
                        {/* Location & Distance */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {[v.city, v.postcode].filter(Boolean).join(", ")}
                          </span>
                        </div>
                        
                        {km !== null && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {km.toFixed(1)} km away
                          </div>
                        )}
                      </div>

                      {/* Reviews */}
                      <div className="flex items-center gap-4 text-sm">
                        {hasReviews && avg !== null ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{avg.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({v.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No reviews yet</span>
                        )}
                      </div>

                      {/* Added date */}
                      {added && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Added {added}
                        </div>
                      )}

                      {/* Tags */}
                      {!!v.tags?.length && (
                        <div className="flex flex-wrap gap-1.5">
                          {v.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary/5 px-2.5 py-1 text-xs text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {v.tags.length > 3 && (
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                              +{v.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}