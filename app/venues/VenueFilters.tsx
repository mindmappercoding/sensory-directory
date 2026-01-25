"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Filter,
  X,
  Sparkles,
  Volume2,
  Sun,
  Users,
  ChevronDown,
} from "lucide-react";

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

const LEVELS = [
  { value: "", label: "Any" },
  { value: "VERY_LOW", label: "Very low" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "VERY_HIGH", label: "Very high" },
] as const;

const SORTS = [
  { value: "", label: "Best match" },
  { value: "nearest", label: "Nearest (postcode)" },
  { value: "newest", label: "Newest" },
  { value: "recentlyReviewed", label: "Recently reviewed" },
  { value: "highestRated", label: "Highest rated" },
  { value: "mostReviewed", label: "Most reviewed" },
] as const;

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
  resultsCount,
}: {
  variant?: "panel" | "bar";
  resultsCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sensoryHours, setSensoryHours] = useState("");
  const [quietSpace, setQuietSpace] = useState("");

  const [noiseLevel, setNoiseLevel] = useState("");
  const [lighting, setLighting] = useState("");
  const [crowding, setCrowding] = useState("");

  const [near, setNear] = useState("");
  const [sort, setSort] = useState("");

  const [open, setOpen] = useState(true);

  // Sync from URL
  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setCity(sp.get("city") ?? "");
    setTags(parseTagsParam(sp.get("tags")));
    setSensoryHours(sp.get("sensoryHours") ?? "");
    setQuietSpace(sp.get("quietSpace") ?? "");

    setNoiseLevel(sp.get("noiseLevel") ?? "");
    setLighting(sp.get("lighting") ?? "");
    setCrowding(sp.get("crowding") ?? "");

    setNear(sp.get("near") ?? "");
    setSort(sp.get("sort") ?? "");
  }, [sp]);

  const qDebounced = useDebouncedValue(q, 250);
  const nearDebounced = useDebouncedValue(near, 400);
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
    noiseLevel?: string;
    lighting?: string;
    crowding?: string;
    near?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams(urlString);

    const nextQ = (next.q ?? qDebounced).trim();
    const nextCity = (next.city ?? city).trim();
    const nextTags = next.tags ?? tags;
    const nextNear = (next.near ?? nearDebounced).trim();

    setParam(params, "q", nextQ);
    setParam(params, "city", nextCity);
    setParam(params, "tags", nextTags.length ? nextTags.join(",") : "");
    setParam(params, "sensoryHours", next.sensoryHours ?? sensoryHours);
    setParam(params, "quietSpace", next.quietSpace ?? quietSpace);

    setParam(params, "noiseLevel", next.noiseLevel ?? noiseLevel);
    setParam(params, "lighting", next.lighting ?? lighting);
    setParam(params, "crowding", next.crowding ?? crowding);

    setParam(params, "near", nextNear);

    const requestedSort = next.sort ?? sort;
    const effectiveSort = nextNear
      ? "nearest"
      : requestedSort === "nearest"
      ? ""
      : requestedSort;

    setParam(params, "sort", effectiveSort);

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

  // Auto-apply when debounced near changes
  useEffect(() => {
    if ((sp.get("near") ?? "") === nearDebounced) return;
    pushState({ near: nearDebounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearDebounced]);

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

    setNoiseLevel("");
    setLighting("");
    setCrowding("");

    setNear("");
    setSort("");

    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const activeCount =
    (qDebounced.trim() ? 1 : 0) +
    (city.trim() ? 1 : 0) +
    (tags.length ? 1 : 0) +
    (sensoryHours ? 1 : 0) +
    (quietSpace ? 1 : 0) +
    (noiseLevel ? 1 : 0) +
    (lighting ? 1 : 0) +
    (crowding ? 1 : 0) +
    (nearDebounced.trim() ? 1 : 0);

  const isBar = variant === "bar";
  const isNearActive = !!nearDebounced.trim();

  return (
    <div className={isBar ? "w-full" : "space-y-4"}>
      {isBar && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            {activeCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {activeCount} active
                </span>
              </div>
            )}

            {typeof resultsCount === "number" && (
              <span className="text-xs text-muted-foreground">
                {resultsCount} {resultsCount === 1 ? "result" : "results"}
              </span>
            )}

            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Updating...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {open ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  Show
                </>
              )}
            </button>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={clear}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Content */}
      {(open || !isBar) && (
        <div className={isBar ? "mt-4" : ""}>
          <div className="space-y-6">
            {/* Search & Location Row */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Search venues
                </label>
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. soft play, museum..."
                    className="w-full rounded-2xl border bg-background px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        pushState({ q: "" });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    pushState({ city: e.target.value });
                  }}
                  placeholder="e.g. Leeds, Manchester..."
                  className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Near postcode
                </label>
                <input
                  value={near}
                  onChange={(e) => setNear(e.target.value)}
                  placeholder="e.g. LS21 3AB"
                  className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
                {isNearActive && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    Sorting by distance
                  </p>
                )}
              </div>
            </div>

            {/* Sensory Features Row */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Sensory features</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sensory hours
                  </label>
                  <select
                    value={sensoryHours}
                    onChange={(e) => {
                      setSensoryHours(e.target.value);
                      pushState({ sensoryHours: e.target.value });
                    }}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sun className="h-3.5 w-3.5" />
                    Quiet space
                  </label>
                  <select
                    value={quietSpace}
                    onChange={(e) => {
                      setQuietSpace(e.target.value);
                      pushState({ quietSpace: e.target.value });
                    }}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Volume2 className="h-3.5 w-3.5" />
                    Noise level
                  </label>
                  <select
                    value={noiseLevel}
                    onChange={(e) => {
                      setNoiseLevel(e.target.value);
                      pushState({ noiseLevel: e.target.value });
                    }}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sun className="h-3.5 w-3.5" />
                    Lighting
                  </label>
                  <select
                    value={lighting}
                    onChange={(e) => {
                      setLighting(e.target.value);
                      pushState({ lighting: e.target.value });
                    }}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Crowding
                  </label>
                  <select
                    value={crowding}
                    onChange={(e) => {
                      setCrowding(e.target.value);
                      pushState({ crowding: e.target.value });
                    }}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Venue types</h3>
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
                        "rounded-full px-4 py-2 text-sm font-medium transition-all",
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border bg-background hover:border-primary/50 hover:bg-primary/5",
                      ].join(" ")}
                      aria-pressed={selected}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <select
                  value={isNearActive ? "nearest" : sort}
                  disabled={isNearActive}
                  onChange={(e) => {
                    setSort(e.target.value);
                    pushState({ sort: e.target.value });
                  }}
                  className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}