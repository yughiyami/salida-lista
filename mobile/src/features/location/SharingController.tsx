import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import type { LocationSubscription } from "expo-location";
import { useSession } from "../auth/useSession";
import { useCircles, usePlaces, useUserSettings } from "../circles/hooks";
import { flushQueues } from "./flush";
import {
  currentPosition,
  hasBackgroundPermission,
  startBackgroundUpdates,
  startForegroundWatch,
  stopBackgroundUpdates,
  stopGeofences,
  syncGeofences,
} from "./sharing";
import { describePause } from "./pause";

/**
 * Headless component that turns the user's consent, pause and circle
 * membership into running location services. Everything stops when sharing
 * is off, paused, or the user has no circle.
 */
export function SharingController() {
  const userId = useSession((s) => s.user?.id);
  const settings = useUserSettings();
  const circles = useCircles();
  const places = usePlaces();
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setAppActive(s === "active"));
    return () => sub.remove();
  }, []);

  const data = settings.data;
  const pausedUntil = data?.sharing_paused_until ?? null;
  const hasCircle = (circles.data?.length ?? 0) > 0;
  const consent = Boolean(data?.location_consent_at);
  const backgroundConsent = Boolean(data?.background_consent_at);
  const paused = describePause(pausedUntil, now).paused;
  const shouldShare = Boolean(userId) && consent && hasCircle && !paused;

  // Re-evaluate exactly when a pause ends.
  useEffect(() => {
    if (!pausedUntil) return;
    const ms = Date.parse(pausedUntil) - Date.now();
    if (ms <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), ms + 500);
    return () => clearTimeout(timer);
  }, [pausedUntil]);

  // Foreground watch + periodic flush while the app is open.
  useEffect(() => {
    if (!shouldShare || !appActive) return;
    let sub: LocationSubscription | null = null;
    let cancelled = false;
    void startForegroundWatch()
      .then((s) => {
        if (cancelled) s?.remove();
        else sub = s;
      })
      .catch(() => {});
    void flushQueues(true);
    const interval = setInterval(() => void flushQueues(), 30_000);
    return () => {
      cancelled = true;
      sub?.remove();
      clearInterval(interval);
    };
  }, [shouldShare, appActive]);

  // Background tracking and geofences only with explicit background consent.
  const placeList = useMemo(() => places.data ?? [], [places.data]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const allowed = shouldShare && backgroundConsent && (await hasBackgroundPermission());
        if (cancelled) return;
        if (!allowed) {
          await stopBackgroundUpdates();
          await stopGeofences();
          return;
        }
        await startBackgroundUpdates();
        await syncGeofences(placeList, await currentPosition());
      } catch {
        // Location services can be unavailable (GPS off, revoked permission).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldShare, backgroundConsent, placeList]);

  return null;
}
