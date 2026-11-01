import { getSupabaseClient, supabase } from "../../lib/supabase";
import { BATCH_SIZE, backoffMs, toRpcPoint } from "./queue";
import {
  deletePlaceEvent,
  deletePoints,
  peekPlaceEvents,
  peekPoints,
} from "./store";

let inFlight: Promise<void> | null = null;
let failures = 0;
let retryNotBefore = 0;

/**
 * Uploads queued positions and geofence events. Safe to call from anywhere:
 * concurrent calls share one run and failures back off exponentially so a
 * dead connection does not drain the battery.
 */
export function flushQueues(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() < retryNotBefore) return Promise.resolve();
  inFlight = doFlush().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doFlush(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const db = getSupabaseClient();

    for (;;) {
      const batch = await peekPoints(BATCH_SIZE);
      if (batch.length === 0) break;
      const { error } = await db.rpc("push_locations", {
        p_points: batch.map((b) => toRpcPoint(b.point)),
      });
      if (error) throw new Error(error.message);
      await deletePoints(batch.map((b) => b.id));
      if (batch.length < BATCH_SIZE) break;
    }

    for (const event of await peekPlaceEvents()) {
      const { error } = await db.rpc("report_place_event", {
        p_place: event.placeId,
        p_kind: event.kind,
      });
      // A place that no longer exists will never succeed: drop it.
      if (error && !/not_a_member|invalid_kind/.test(error.message)) {
        throw new Error(error.message);
      }
      await deletePlaceEvent(event.id);
    }

    failures = 0;
    retryNotBefore = 0;
  } catch {
    failures += 1;
    retryNotBefore = Date.now() + backoffMs(failures);
  }
}
