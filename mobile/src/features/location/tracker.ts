import * as Battery from "expo-battery";
import type { LocationObject } from "expo-location";
import { flushQueues } from "./flush";
import { shouldRecordPoint, type QueuedPoint, type RawFix } from "./queue";
import { enqueuePoint } from "./store";

let lastRecorded: RawFix | null = null;

async function readBattery(): Promise<{ level: number | null; charging: boolean | null }> {
  try {
    const [level, state] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.getBatteryStateAsync(),
    ]);
    return {
      level: level >= 0 ? level : null,
      charging:
        state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
    };
  } catch {
    return { level: null, charging: null };
  }
}

/** Stores a fix in the offline queue (when it is worth keeping) and tries to upload. */
export async function recordLocation(location: LocationObject): Promise<boolean> {
  const { latitude, longitude, accuracy, speed } = location.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

  const fix: RawFix = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    timestamp: location.timestamp,
  };
  if (!shouldRecordPoint(lastRecorded, fix)) return false;
  lastRecorded = fix;

  const battery = await readBattery();
  const point: QueuedPoint = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    speed: speed ?? null,
    batteryLevel: battery.level,
    isCharging: battery.charging,
    recordedAt: location.timestamp,
  };
  await enqueuePoint(point);
  void flushQueues();
  return true;
}

export function resetTracker(): void {
  lastRecorded = null;
}
