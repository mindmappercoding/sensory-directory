"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function BackfillGeoButton() {
  const [pending, startTransition] = useTransition();

  async function run() {
    const ok = window.confirm(
      "Backfill lat/lng/geohash for venues missing geo? (uses postcodes.io)"
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/venues/backfill-geo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 50 }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.error ? String(json.error) : "Backfill failed");
          return;
        }

        toast.success("Geo backfill complete", {
          description: `Updated ${json?.updated ?? 0} venue(s). Skipped ${
            json?.skipped ?? 0
          }.`,
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Backfill failed");
      }
    });
  }

  return (
    <Button
      onClick={run}
      disabled={pending}
      variant="outline"
      size="sm"
      className="rounded-2xl"
      title="Populate geo fields for venues missing lat/lng"
    >
      {pending ? (
        <>
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Backfilling…
        </>
      ) : (
        <>
          <MapPin className="mr-2 h-3.5 w-3.5" />
          Backfill venue geo
        </>
      )}
    </Button>
  );
}