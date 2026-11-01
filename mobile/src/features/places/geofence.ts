import { haversineMeters, type LatLng } from "../../domain/geo";

// Android caps an app at 100 simultaneous geofences.
export const MAX_GEOFENCES = 100;

export function nearestPlaces<T extends LatLng>(
  places: T[],
  from: LatLng | null,
  max: number = MAX_GEOFENCES,
): T[] {
  if (!from) return places.slice(0, max);
  return [...places]
    .sort((a, b) => haversineMeters(from, a) - haversineMeters(from, b))
    .slice(0, max);
}

// expo-location GeofencingEventType: Enter = 1, Exit = 2.
export function geofenceKind(eventType: number): "arrive" | "leave" | null {
  if (eventType === 1) return "arrive";
  if (eventType === 2) return "leave";
  return null;
}
