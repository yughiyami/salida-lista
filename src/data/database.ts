import type { SQLiteDatabase } from "expo-sqlite";
import type { FieldEvent, Participant } from "../domain/types";
import {
  CHECKLIST_KEYS,
  DEMO_PARTICIPANTS,
  SCHEMA_SQL,
  SCHEMA_VERSION,
} from "./schema";

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const current = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((current?.user_version ?? 0) > SCHEMA_VERSION)
    throw new Error("Esta base necesita una versión más reciente de la app.");
  if (current?.user_version === SCHEMA_VERSION) return;
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(SCHEMA_SQL);
    for (const [id, name] of DEMO_PARTICIPANTS) {
      await tx.runAsync(
        "INSERT OR IGNORE INTO participants (id, name, group_name) VALUES (?, ?, ?)",
        id,
        name,
        "Grupo de Luis",
      );
    }
    for (const key of CHECKLIST_KEYS) {
      await tx.runAsync(
        "INSERT OR IGNORE INTO checklist (key) VALUES (?)",
        key,
      );
    }
    await tx.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}

export async function readGuideData(db: SQLiteDatabase) {
  const participantRows = await db.getAllAsync<{
    id: string;
    name: string;
    present: number;
    group_name: string;
  }>("SELECT * FROM participants ORDER BY id");
  const eventRows = await db.getAllAsync<{
    id: string;
    type: FieldEvent["type"];
    note: string;
    occurred_at: string;
    position_json: string | null;
    status: "LOCAL_PENDING";
  }>("SELECT * FROM field_events ORDER BY rowid DESC");
  const checks = await db.getAllAsync<{ key: string; checked: number }>(
    "SELECT * FROM checklist",
  );
  return {
    participants: participantRows.map((p): Participant => ({
      id: p.id,
      name: p.name,
      present: p.present === 1,
      groupName: p.group_name,
    })),
    events: eventRows.map((e): FieldEvent => ({
      id: e.id,
      type: e.type,
      note: e.note,
      occurredAt: e.occurred_at,
      position: e.position_json ? JSON.parse(e.position_json) : null,
      status: e.status,
    })),
    checklist: Object.fromEntries(
      checks.map((c) => [c.key, c.checked === 1]),
    ) as Record<string, boolean>,
  };
}

export async function persistEvent(
  db: SQLiteDatabase,
  event: FieldEvent,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      "INSERT INTO field_events (id, type, note, occurred_at, position_json) VALUES (?, ?, ?, ?, ?)",
      event.id,
      event.type,
      event.note,
      event.occurredAt,
      event.position ? JSON.stringify(event.position) : null,
    );
    await tx.runAsync(
      "INSERT INTO outbox (event_id, created_at) VALUES (?, ?)",
      event.id,
      event.occurredAt,
    );
  });
}

export async function persistPresence(
  db: SQLiteDatabase,
  id: string,
  present: boolean,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync(
      "UPDATE participants SET present = ? WHERE id = ?",
      present ? 1 : 0,
      id,
    );
    if (result.changes !== 1) throw new Error("Participante no encontrado.");
    await tx.runAsync(
      "INSERT INTO local_audit (entity_id, action, payload_json, created_at) VALUES (?, ?, ?, ?)",
      id,
      "PRESENCE_CHANGED",
      JSON.stringify({ present }),
      new Date().toISOString(),
    );
  });
}

export async function persistChecklist(
  db: SQLiteDatabase,
  key: string,
  checked: boolean,
): Promise<void> {
  if (!CHECKLIST_KEYS.some((k) => k === key))
    throw new Error("Elemento de preparación desconocido.");
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync(
      "UPDATE checklist SET checked = ? WHERE key = ?",
      checked ? 1 : 0,
      key,
    );
    if (result.changes !== 1) throw new Error("Preparación no encontrada.");
    await tx.runAsync(
      "INSERT INTO local_audit (entity_id, action, payload_json, created_at) VALUES (?, ?, ?, ?)",
      key,
      "CHECKLIST_CHANGED",
      JSON.stringify({ checked }),
      new Date().toISOString(),
    );
  });
}
