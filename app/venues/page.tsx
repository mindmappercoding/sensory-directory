// app/venues/page.tsx
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Venues</h1>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-md">
          Know a place that works well for children with sensory needs? Help
          other parents by sharing it.
        </p>

        <Link href="/submit">
          <Button variant="outline">Submit a venue</Button>
        </Link>
      </div>

      <VenueFilters />

      <div className="mt-4 space-y-3">
        {venues.map((v) => (
          <Link
            key={v.id}
            href={`/venues/${v.id}`}
            className="block rounded-xl border p-4 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{v.name}</div>
                <div className="text-sm text-muted-foreground">
                  {[v.city, v.postcode].filter(Boolean).join(" • ")}
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
          </Link>
        ))}
      </div>
    </main>
  );
}
