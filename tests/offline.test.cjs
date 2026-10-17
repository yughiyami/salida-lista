const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const fs = require("node:fs");

// Execute our TypeScript domain/repository unchanged against real SQLite.
// Expo adapter/device lifecycle is verified separately on a phone.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
};
const { createFieldEvent, formatReport } = require("../src/domain/events.ts");
const {
  initializeDatabase,
  persistEvent,
  readGuideData,
  persistPresence,
  persistChecklist,
} = require("../src/data/database.ts");

function adapter(file = ":memory:") {
  const sql = new DatabaseSync(file);
  const db = {
    execAsync: async (query) => {
      sql.exec(query);
    },
    runAsync: async (query, ...args) => sql.prepare(query).run(...args),
    getFirstAsync: async (query, ...args) =>
      sql.prepare(query).get(...args) ?? null,
    getAllAsync: async (query, ...args) => sql.prepare(query).all(...args),
    withExclusiveTransactionAsync: async (fn) => {
      sql.exec("BEGIN IMMEDIATE");
      try {
        await fn(db);
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => sql.close(),
  };
  return db;
}
const input = { type: "DEMORA", note: " Pausa del grupo ", position: null };
const now = "2026-10-16T15:42:00.000Z";

test("valida texto/tipo y permite guardar sin GNSS", () => {
  const event = createFieldEvent(input, "e-1", now);
  assert.equal(event.note, "Pausa del grupo");
  assert.equal(event.status, "LOCAL_PENDING");
  assert.equal(event.position, null);
  assert.throws(() => createFieldEvent({ ...input, note: "  " }, "e-1", now));
  assert.throws(() => createFieldEvent({ ...input, type: "SOS" }, "e-1", now));
  assert.throws(() =>
    createFieldEvent({ ...input, note: "a".repeat(2001) }, "e-1", now),
  );
});

test("rechaza coordenadas inválidas y conserva precisión/hora propias", () => {
  const position = {
    latitude: -13.2,
    longitude: -72.5,
    accuracy: 18,
    capturedAt: now,
  };
  assert.deepEqual(
    createFieldEvent({ ...input, position }, "e-1", now).position,
    position,
  );
  assert.throws(() =>
    createFieldEvent(
      { ...input, position: { ...position, latitude: NaN } },
      "e-1",
      now,
    ),
  );
  assert.throws(() =>
    createFieldEvent(
      { ...input, position: { ...position, longitude: 181 } },
      "e-1",
      now,
    ),
  );
  assert.throws(() =>
    createFieldEvent(
      { ...input, position: { ...position, accuracy: -1 } },
      "e-1",
      now,
    ),
  );
});

test("parte siempre distingue demo, hora original y recepción no verificada", () => {
  const report = formatReport(createFieldEvent(input, "e-1", now));
  assert.match(report, /DEMOSTRACIÓN/);
  assert.match(report, /NO ES UN SOS/);
  assert.match(report, /NO DISPONIBLE/);
  assert.ok(report.includes(now));
  assert.match(report, /no ha verificado entrega ni aceptación/);
});

test("migración idempotente no reinicia presencia ni checklist", async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await persistPresence(db, "demo-01", true);
    await persistChecklist(db, "equipment", true);
    await initializeDatabase(db);
    const data = await readGuideData(db);
    assert.equal(data.participants.length, 8);
    assert.equal(data.participants[0].present, true);
    assert.equal(data.checklist.equipment, true);
    assert.equal((await db.getAllAsync("SELECT * FROM local_audit")).length, 2);
    await assert.rejects(persistChecklist(db, "unknown", true));
  } finally {
    db.close();
  }
});

test("evento y outbox persisten tras cerrar/reabrir base de archivo", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "salida-lista-test-"));
  let db = adapter(path.join(dir, "offline.db"));
  try {
    await initializeDatabase(db);
    for (let i = 0; i < 100; i++)
      await persistEvent(db, createFieldEvent(input, `e-${i}`, now));
    db.close();
    db = adapter(path.join(dir, "offline.db"));
    await initializeDatabase(db);
    const data = await readGuideData(db);
    assert.equal(data.events.length, 100);
    assert.equal((await db.getAllAsync("SELECT * FROM outbox")).length, 100);
    assert.ok(data.events.every((e) => e.status === "LOCAL_PENDING"));
    await assert.rejects(persistEvent(db, createFieldEvent(input, "e-0", now)));
    assert.equal((await readGuideData(db)).events.length, 100);
  } finally {
    db.close();
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("salida-lista-test-"));
    rmSync(resolved, { recursive: true, force: true });
  }
});

test("fallo de outbox revierte también el evento", async () => {
  const db = adapter();
  try {
    await initializeDatabase(db);
    await db.execAsync(
      "CREATE TRIGGER reject_outbox BEFORE INSERT ON outbox BEGIN SELECT RAISE(ABORT, 'disk failure simulation'); END;",
    );
    await assert.rejects(persistEvent(db, createFieldEvent(input, "e-1", now)));
    assert.equal((await readGuideData(db)).events.length, 0);
    assert.equal((await db.getAllAsync("SELECT * FROM outbox")).length, 0);
  } finally {
    db.close();
  }
});

test("base futura no se degrada ni se borra", async () => {
  const db = adapter();
  try {
    await db.execAsync("PRAGMA user_version=99");
    await assert.rejects(initializeDatabase(db), /más reciente/);
  } finally {
    db.close();
  }
});
