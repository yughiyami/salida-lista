export const SCHEMA_VERSION = 1;
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  present INTEGER NOT NULL DEFAULT 0 CHECK(present IN (0,1)),
  group_name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checklist (
  key TEXT PRIMARY KEY NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0 CHECK(checked IN (0,1))
);
CREATE TABLE IF NOT EXISTS field_events (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('HITO','DEMORA','INCIDENCIA','RETORNO')),
  note TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  position_json TEXT,
  status TEXT NOT NULL DEFAULT 'LOCAL_PENDING' CHECK(status = 'LOCAL_PENDING')
);
CREATE TABLE IF NOT EXISTS outbox (
  event_id TEXT PRIMARY KEY NOT NULL REFERENCES field_events(id),
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state = 'PENDING'),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS local_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export const DEMO_PARTICIPANTS = [
  ["demo-01", "Valeria Torres"],
  ["demo-02", "Mateo Rojas"],
  ["demo-03", "Lucía Flores"],
  ["demo-04", "Diego Salas"],
  ["demo-05", "Camila Vega"],
  ["demo-06", "Nicolás Ruiz"],
  ["demo-07", "Sofía Castro"],
  ["demo-08", "Andrés León"],
] as const;
export const CHECKLIST_KEYS = [
  "participants",
  "route",
  "equipment",
  "channel",
] as const;
