import * as SQLite from "expo-sqlite";
import { MAX_QUEUE_SIZE, type QueuedPoint } from "./queue";

// A separate database from the offline guide: background tasks can run while
// the UI (and its SQLiteProvider) does not exist.
const DB_NAME = "salida-lista-location.db";
const PLACE_EVENT_MAX_AGE_MS = 30 * 60_000;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS location_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS place_event_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          occurred_at INTEGER NOT NULL
        );
      `);
      return db;
    })().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

export async function enqueuePoint(point: QueuedPoint): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO location_queue (payload) VALUES (?)", [
    JSON.stringify(point),
  ]);
  // Keep the newest MAX_QUEUE_SIZE rows.
  await db.runAsync(
    `DELETE FROM location_queue WHERE id <= (
       SELECT id FROM location_queue ORDER BY id DESC LIMIT 1 OFFSET ?
     )`,
    [MAX_QUEUE_SIZE],
  );
}

export async function peekPoints(
  limit: number,
): Promise<{ id: number; point: QueuedPoint }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; payload: string }>(
    "SELECT id, payload FROM location_queue ORDER BY id ASC LIMIT ?",
    [limit],
  );
  return rows.map((r) => ({ id: r.id, point: JSON.parse(r.payload) as QueuedPoint }));
}

export async function deletePoints(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM location_queue WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
}

export async function countPoints(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM location_queue",
  );
  return row?.n ?? 0;
}

export type QueuedPlaceEvent = {
  id: number;
  placeId: string;
  kind: "arrive" | "leave";
  occurredAt: number;
};

export async function enqueuePlaceEvent(
  placeId: string,
  kind: "arrive" | "leave",
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO place_event_queue (place_id, kind, occurred_at) VALUES (?, ?, ?)",
    [placeId, kind, Date.now()],
  );
}

export async function peekPlaceEvents(): Promise<QueuedPlaceEvent[]> {
  const db = await getDb();
  await db.runAsync("DELETE FROM place_event_queue WHERE occurred_at < ?", [
    Date.now() - PLACE_EVENT_MAX_AGE_MS,
  ]);
  const rows = await db.getAllAsync<{
    id: number;
    place_id: string;
    kind: "arrive" | "leave";
    occurred_at: number;
  }>("SELECT id, place_id, kind, occurred_at FROM place_event_queue ORDER BY id ASC LIMIT 50");
  return rows.map((r) => ({
    id: r.id,
    placeId: r.place_id,
    kind: r.kind,
    occurredAt: r.occurred_at,
  }));
}

export async function deletePlaceEvent(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM place_event_queue WHERE id = ?", [id]);
}

/** Called on sign-out or account deletion: nothing may outlive the session. */
export async function clearLocationData(): Promise<void> {
  const db = await getDb();
  await db.execAsync("DELETE FROM location_queue; DELETE FROM place_event_queue;");
}
