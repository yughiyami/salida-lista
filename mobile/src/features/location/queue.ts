import { haversineMeters } from "../../domain/geo";

export type RawFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export type QueuedPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
  recordedAt: number;
};

export const MAX_ACCURACY_M = 200;
export const MIN_DISTANCE_M = 25;
export const MIN_INTERVAL_MS = 15_000;
export const HEARTBEAT_MS = 120_000;
export const MAX_QUEUE_SIZE = 2_000;
export const BATCH_SIZE = 100;

/** Decides whether a new GPS fix is worth storing and uploading. */
export function shouldRecordPoint(last: RawFix | null, next: RawFix): boolean {
  if (next.accuracy !== null && next.accuracy > MAX_ACCURACY_M) return false;
  if (!last) return true;
  const elapsed = next.timestamp - last.timestamp;
  if (elapsed >= HEARTBEAT_MS) return true;
  if (elapsed < MIN_INTERVAL_MS) return false;
  return haversineMeters(last, next) >= MIN_DISTANCE_M;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Keeps the newest `max` items (the queue is ordered oldest first). */
export function trimQueue<T>(items: T[], max: number): T[] {
  return items.length > max ? items.slice(items.length - max) : items;
}

export function backoffMs(failures: number): number {
  if (failures <= 0) return 0;
  return Math.min(15_000 * 2 ** (failures - 1), 300_000);
}

export function toRpcPoint(point: QueuedPoint) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy_m: point.accuracy,
    speed_mps: point.speed !== null && point.speed >= 0 ? point.speed : null,
    battery_level: point.batteryLevel,
    is_charging: point.isCharging,
    recorded_at: new Date(point.recordedAt).toISOString(),
  };
}
