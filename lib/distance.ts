// lib/distance.ts
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371e3; // metres
  const toRad = (d: number) => (d * Math.PI) / 180;

  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);

  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}
