// lib/postcodes.ts
type PostcodesIoLookup = {
  status: number;
  result?: {
    latitude: number | null;
    longitude: number | null;
  } | null;
};

const cache = new Map<string, { lat: number; lng: number; ts: number }>();
const CACHE_MS = 1000 * 60 * 60; // 1 hour

export function normalizeUKPostcode(postcode: string) {
  return postcode.trim().toUpperCase().replace(/\s+/g, " ");
}

export async function geocodeUKPostcode(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const pc = normalizeUKPostcode(postcode);
  if (!pc) return null;

  const cached = cache.get(pc);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return { lat: cached.lat, lng: cached.lng };
  }

  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });

  if (!res.ok) return null;

  const json = (await res.json()) as PostcodesIoLookup;
  const lat = json?.result?.latitude ?? null;
  const lng = json?.result?.longitude ?? null;

  if (typeof lat !== "number" || typeof lng !== "number") return null;

  cache.set(pc, { lat, lng, ts: Date.now() });
  return { lat, lng };
}
