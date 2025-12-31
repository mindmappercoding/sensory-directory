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

  const qDebounced = useDebouncedValue(q, 250);

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
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  // Auto-apply when debounced q changes
  useEffect(() => {
    if ((sp.get("q") ?? "") === qDebounced) return;
    pushState({ q: qDebounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

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
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const activeCount =
    (qDebounced ? 1 : 0) +
    (city.trim() ? 1 : 0) +
    (tags.length ? 1 : 0) +
    (sensoryHours ? 1 : 0) +
    (quietSpace ? 1 : 0);

  return (
    <div className="rounded-3xl border bg-card/60 p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Filter & search</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Search is <span className="text-foreground/90">venue name only</span>.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="rounded-full border bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
              {activeCount} active
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-sm">
          <div className="mb-1 font-medium">Search</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Cineworld, Soft Play..."
            className="w-full rounded-xl border bg-background/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          />
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
            className="w-full rounded-xl border bg-background/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
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
              className="w-full rounded-xl border bg-background/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
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
              className="w-full rounded-xl border bg-background/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
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
              className="text-xs text-primary hover:underline"
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
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground border-primary/30"
                    : "bg-background/70 hover:bg-muted/60",
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
          className="rounded-xl border bg-background/70 px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-60"
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
