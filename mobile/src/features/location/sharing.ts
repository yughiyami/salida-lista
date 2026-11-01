import * as Location from "expo-location";
import type { Place } from "../circles/types";
import { nearestPlaces } from "../places/geofence";
import { BACKGROUND_LOCATION_TASK, GEOFENCE_TASK } from "./tasks";
import { recordLocation } from "./tracker";

export async function ensureForegroundPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  const asked = await Location.requestForegroundPermissionsAsync();
  return asked.granted;
}

export async function hasBackgroundPermission(): Promise<boolean> {
  const current = await Location.getBackgroundPermissionsAsync();
  return current.granted;
}

export async function ensureBackgroundPermission(): Promise<boolean> {
  if (!(await ensureForegroundPermission())) return false;
  if (await hasBackgroundPermission()) return true;
  // On Android 11+ this opens system settings: the caller must explain why first.
  const asked = await Location.requestBackgroundPermissionsAsync();
  return asked.granted;
}

export async function startForegroundWatch(): Promise<Location.LocationSubscription | null> {
  if (!(await Location.hasServicesEnabledAsync())) return null;
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15_000,
      distanceInterval: 20,
      mayShowUserSettingsDialog: false,
    },
    (location) => {
      void recordLocation(location);
    },
  );
}

export async function startBackgroundUpdates(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) return;
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60_000,
    distanceInterval: 50,
    deferredUpdatesInterval: 60_000,
    deferredUpdatesDistance: 50,
    mayShowUserSettingsDialog: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Salida Lista comparte tu ubicación",
      notificationBody: "Tu círculo ve dónde estás. Pausa o detén esto en Ajustes.",
      notificationColor: "#163F35",
    },
  });
}

export async function stopBackgroundUpdates(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function syncGeofences(
  places: Place[],
  from: { latitude: number; longitude: number } | null,
): Promise<void> {
  const active = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (places.length === 0) {
    if (active) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }
  const regions: Location.LocationRegion[] = nearestPlaces(places, from).map((p) => ({
    identifier: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    radius: p.radius_m,
    notifyOnEnter: true,
    notifyOnExit: true,
  }));
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

export async function stopGeofences(): Promise<void> {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

export async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    const fresh = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
  } catch {
    return null;
  }
}
