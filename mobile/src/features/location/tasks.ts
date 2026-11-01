import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { geofenceKind } from "../places/geofence";
import { flushQueues } from "./flush";
import { enqueuePlaceEvent } from "./store";
import { recordLocation } from "./tracker";

export const BACKGROUND_LOCATION_TASK = "salida-lista-background-location";
export const GEOFENCE_TASK = "salida-lista-geofencing";

// Tasks must be defined at module scope so they exist when Android wakes the
// app headlessly. This module is imported from the app entry point (index.ts).
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    if (error || !data?.locations) return;
    for (const location of data.locations) {
      await recordLocation(location);
    }
    await flushQueues();
  },
);

TaskManager.defineTask<{
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data?.region?.identifier) return;
  const kind = geofenceKind(data.eventType);
  if (!kind) return;
  await enqueuePlaceEvent(data.region.identifier, kind);
  await flushQueues(true);
});
