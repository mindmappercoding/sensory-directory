"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function VenueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state (controlled inputs)
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tag, setTag] = useState("");
  const [sensoryHours, setSensoryHours] = useState(""); // "", "true", "false"
  const [quietSpace, setQuietSpace] = useState("");

  // Keep inputs in sync when URL changes (back/forward, shared links)
  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setCity(sp.get("city") ?? "");
    setTag(sp.get("tag") ?? "");
    setSensoryHours(sp.get("sensoryHours") ?? "");
    setQuietSpace(sp.get("quietSpace") ?? "");
  }, [sp]);

  function apply() {
  const params = new URLSearchParams(sp.toString());

  const setOrDelete = (key: string, value: string) => {
    if (!value) params.delete(key);
    else params.set(key, value);
  };

  setOrDelete("q", q.trim());
  setOrDelete("city", city.trim());
  setOrDelete("tag", tag.trim());
  setOrDelete("sensoryHours", sensoryHours);
  setOrDelete("quietSpace", quietSpace);

  router.push(`${pathname}?${params.toString()}`);
  router.refresh(); // good with turbopack/app router
}


  function clear() {
    startTransition(() => {
      router.push(pathname);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 font-medium">Search</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name / description / tags…"
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-medium">City</div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Leeds"
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-medium">Tag</div>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. softplay"
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 font-medium">Sensory hours</div>
            <select
              value={sensoryHours}
              onChange={(e) => setSensoryHours(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 font-medium">Quiet space</div>
            <select
              value={quietSpace}
              onChange={(e) => setQuietSpace(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={apply}
          disabled={isPending}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {isPending ? "Applying..." : "Apply filters"}
        </button>
        <button
          onClick={clear}
          disabled={isPending}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
