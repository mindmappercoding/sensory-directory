"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const AVAILABLE_TAGS = [
  "softplay",
  "cinema",
  "museum",
  "park",
  "swimming",
  "sensory-friendly",
  "family",
  "indoor",
  "outdoor",
];

function parseTagsParam(val: string | null) {
  if (!val) return [];
  return val
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function VenueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Controlled inputs
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sensoryHours, setSensoryHours] = useState(""); // "", "true", "false"
  const [quietSpace, setQuietSpace] = useState("");

  // Sync from URL
  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setCity(sp.get("city") ?? "");
    setTags(parseTagsParam(sp.get("tags")));
    setSensoryHours(sp.get("sensoryHours") ?? "");
    setQuietSpace(sp.get("quietSpace") ?? "");
  }, [sp]);

  // Debounce search typing so it feels "live" but not spammy
  const qDebounced = useDebouncedValue(q, 250);

  useEffect(() => {
    // ✅ Guard: don’t push if URL already matches debounced value
    if ((sp.get("q") ?? "") === qDebounced) return;

    const params = new URLSearchParams(sp.toString());

    if (qDebounced) params.set("q", qDebounced);
    else params.delete("q");

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  const urlString = useMemo(() => sp.toString(), [sp]);

  function setParam(params: URLSearchParams, key: string, value: string) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }

  function pushState(next: {
    q?: string;
    city?: string;
    tags?: string[];
    sensoryHours?: string;
    quietSpace?: string;
  }) {
    const params = new URLSearchParams(urlString);

    setParam(params, "q", (next.q ?? qDebounced).trim());
    setParam(params, "city", (next.city ?? city).trim());
    setParam(
      params,
      "tags",
      (next.tags ?? tags).length ? (next.tags ?? tags).join(",") : ""
    );
    setParam(params, "sensoryHours", next.sensoryHours ?? sensoryHours);
    setParam(params, "quietSpace", next.quietSpace ?? quietSpace);

    startTransition(() => {
      // ✅ replace = feels real-time (no history spam)
      router.replace(`${pathname}?${params.toString()}`);
    });
  }


  function toggleTag(tag: string) {
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setTags(next);
    pushState({ tags: next });
  }

  function clear() {
    setQ("");
    setCity("");
    setTags([]);
    setSensoryHours("");
    setQuietSpace("");
    startTransition(() => router.replace(pathname));
  }

  return (
    <div className="mt-4 rounded-xl border p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 font-medium">Search</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venue name…"
            className="w-full rounded-md border px-3 py-2"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Searches venue names only.
          </div>
        </label>

        <label className="text-sm">
          <div className="mb-1 font-medium">City</div>
          <input
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              pushState({ city: e.target.value });
            }}
            placeholder="e.g. Leeds"
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 font-medium">Sensory hours</div>
            <select
              value={sensoryHours}
              onChange={(e) => {
                setSensoryHours(e.target.value);
                pushState({ sensoryHours: e.target.value });
              }}
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
              onChange={(e) => {
                setQuietSpace(e.target.value);
                pushState({ quietSpace: e.target.value });
              }}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Tags</div>
          {tags.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTags([]);
                pushState({ tags: [] });
              }}
              className="text-xs underline text-muted-foreground"
            >
              Clear tags
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((t) => {
            const selected = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={[
                  "rounded-full border px-3 py-1 text-xs",
                  selected ? "bg-muted" : "hover:bg-muted/50",
                ].join(" ")}
                aria-pressed={selected}
              >
                {t}
              </button>
            );
          })}
        </div>

        {tags.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Selected: {tags.join(", ")}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clear}
          disabled={isPending}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Clear all
        </button>

        {isPending && (
          <span className="text-xs text-muted-foreground">Updating…</span>
        )}
      </div>
    </div>
  );
}
