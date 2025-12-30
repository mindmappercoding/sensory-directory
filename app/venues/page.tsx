import Link from "next/link";
import { listVenues } from "@/lib/venues";
import VenueFilters from "./VenueFilters";

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
    tag: typeof sp.tag === "string" ? sp.tag : undefined,
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

      <VenueFilters />

      <div className="mt-4 space-y-3">
        {venues.map((v) => (
          <Link
            key={v.id}
            href={`/venues/${v.id}`}
            className="block rounded-xl border p-4 hover:bg-muted/40"
          >
            <div className="font-medium">{v.name}</div>
            <div className="text-sm text-muted-foreground">
              {[v.city, v.postcode].filter(Boolean).join(" • ")}
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
