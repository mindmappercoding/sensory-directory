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

export default function VenueFilters({
  variant = "panel",
}: {
  variant?: "panel" | "bar";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sensoryHours, setSensoryHours] = useState(""); // "", "true", "false"
  const [quietSpace, setQuietSpace] = useState("");

  // NEW: collapsible state (default open on desktop-ish, but you can change default)
  const [open, setOpen] = useState(true);

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

  const isBar = variant === "bar";

  return (
    <div
      className={
        isBar
          ? "w-full"
          : "rounded-3xl bg-card shadow-sm ring-1 ring-border/50 p-4 sm:p-5 space-y-4"
      }
    >
      {/* BAR HEADER (always visible in bar mode) */}
      {isBar && (
        <div className="w-full border-b bg-background">
          <div className="mx-auto max-w-7xl ">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm font-semibold">Filters</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Search is <span className="text-foreground/90">venue name only</span>.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {activeCount} active
                  </span>
                )}

                {isPending && (
                  <span className="text-xs text-muted-foreground">Updating…</span>
                )}

                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-95"
                >
                  {open ? "Hide filters" : "Show filters"}
                </button>

                <button
                  type="button"
                  onClick={clear}
                  disabled={isPending}
                  className="rounded-xl bg-muted px-3 py-2 text-sm hover:opacity-95 disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BODY */}
      <div
        className={
          isBar
            ? [
                "w-full",
                open ? "block" : "hidden",
                "bg-background",
              ].join(" ")
            : "space-y-4"
        }
      >
        {isBar && (
          <div className="mx-auto max-w-7xl  py-4">
            <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border/50 p-4 sm:p-5 space-y-4">
              {/* Inputs row */}
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_0.9fr_0.9fr] lg:items-end">
                <label className="text-sm">
                  <div className="mb-1 font-medium">Search</div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. Cineworld, Soft Play..."
                    className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
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
                    className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 font-medium">Sensory hours</div>
                  <select
                    value={sensoryHours}
                    onChange={(e) => {
                      setSensoryHours(e.target.value);
                      pushState({ sensoryHours: e.target.value });
                    }}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
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
                    className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
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
                          "rounded-full px-3 py-1.5 text-xs transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:opacity-95",
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
            </div>
          </div>
        )}

        {/* PANEL MODE (your original layout, just “less borders”) */}
        {!isBar && (
          <div className="space-y-4">
            {/* Keep your existing panel UI here if you still use variant="panel" */}
          </div>
        )}
      </div>
    </div>
  );
}
