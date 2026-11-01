export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_M = 6_371_008.8;
export const STALE_AFTER_MS = 10 * 60_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isInsideRadius(
  point: LatLng,
  center: LatLng,
  radiusM: number,
): boolean {
  return haversineMeters(point, center) <= radiusM;
}

export function formatLastSeen(recordedAtMs: number, nowMs: number): string {
  const diff = nowMs - recordedAtMs;
  if (diff < 60_000) return "ahora";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export function isStale(recordedAtMs: number, nowMs: number): boolean {
  return nowMs - recordedAtMs > STALE_AFTER_MS;
}

export function formatBattery(
  level: number | null | undefined,
  charging: boolean | null | undefined,
): string {
  if (level === null || level === undefined || !Number.isFinite(level)) {
    return "Batería desconocida";
  }
  const percent = `${Math.round(level * 100)} %`;
  return charging ? `${percent} · cargando` : percent;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Closed [lng, lat] ring approximating a circle of `radiusM` meters. */
export function circlePolygon(
  center: LatLng,
  radiusM: number,
  steps = 48,
): [number, number][] {
  const angular = radiusM / EARTH_RADIUS_M;
  const lat1 = toRad(center.latitude);
  const lng1 = toRad(center.longitude);
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      );
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  ring.push(ring[0]!);
  return ring;
}

/** Returns [west, south, east, north] or null when there are no points. */
export function computeBounds(
  points: LatLng[],
): [number, number, number, number] | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const p of points) {
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
  }
  return [west, south, east, north];
}
