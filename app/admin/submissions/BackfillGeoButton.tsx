"use client";

import { useTransition } from "react";
import { toast } from "sonner";

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
    <button
      onClick={run}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
      title="Populate geo fields for venues missing lat/lng"
    >
      {pending ? "Backfilling…" : "Backfill venue geo"}
    </button>
  );
}
