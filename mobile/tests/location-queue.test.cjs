const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/load-ts.cjs");

const {
  shouldRecordPoint,
  chunk,
  trimQueue,
  backoffMs,
  toRpcPoint,
} = require("../src/features/location/queue.ts");
const { describePause, PAUSE_OPTIONS } = require("../src/features/location/pause.ts");
const { nearestPlaces, geofenceKind } = require("../src/features/places/geofence.ts");

const t0 = 1_800_000_000_000;
const base = { latitude: -16.409, longitude: -71.5375, accuracy: 10, timestamp: t0 };

test("el primer punto siempre se registra", () => {
  assert.equal(shouldRecordPoint(null, base), true);
});

test("descarta fixes con precisión peor que 200 m", () => {
  assert.equal(shouldRecordPoint(null, { ...base, accuracy: 350 }), false);
  assert.equal(shouldRecordPoint(null, { ...base, accuracy: null }), true);
});

test("exige distancia y tiempo mínimos entre puntos", () => {
  const moved = { ...base, latitude: -16.4094, timestamp: t0 + 20_000 }; // ~45 m
  assert.equal(shouldRecordPoint(base, moved), true);
  const tooSoon = { ...moved, timestamp: t0 + 5_000 };
  assert.equal(shouldRecordPoint(base, tooSoon), false);
  const tooClose = { ...base, latitude: -16.40905, timestamp: t0 + 20_000 }; // ~5 m
  assert.equal(shouldRecordPoint(base, tooClose), false);
});

test("emite un latido tras dos minutos aunque no te muevas", () => {
  const still = { ...base, timestamp: t0 + 121_000 };
  assert.equal(shouldRecordPoint(base, still), true);
});

test("chunk parte en lotes y trimQueue conserva los más recientes", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
  assert.deepEqual(trimQueue([1, 2, 3, 4], 2), [3, 4]);
  assert.deepEqual(trimQueue([1], 5), [1]);
});

test("backoff exponencial con tope de cinco minutos", () => {
  assert.equal(backoffMs(0), 0);
  assert.equal(backoffMs(1), 15_000);
  assert.equal(backoffMs(2), 30_000);
  assert.equal(backoffMs(10), 300_000);
});

test("toRpcPoint serializa al formato de push_locations", () => {
  const point = toRpcPoint({
    latitude: 1,
    longitude: 2,
    accuracy: 5,
    speed: -1,
    batteryLevel: 0.4,
    isCharging: false,
    recordedAt: t0,
  });
  assert.deepEqual(point, {
    latitude: 1,
    longitude: 2,
    accuracy_m: 5,
    speed_mps: null,
    battery_level: 0.4,
    is_charging: false,
    recorded_at: new Date(t0).toISOString(),
  });
});

test("describePause informa pausa activa y tiempo restante", () => {
  const now = t0;
  assert.deepEqual(describePause(null, now), { paused: false, label: "Compartiendo" });
  assert.deepEqual(describePause(new Date(now - 1000).toISOString(), now), {
    paused: false,
    label: "Compartiendo",
  });
  const active = describePause(new Date(now + 45 * 60_000).toISOString(), now);
  assert.equal(active.paused, true);
  assert.match(active.label, /45 min/);
  assert.ok(PAUSE_OPTIONS.length >= 3);
});

test("nearestPlaces limita a las N más cercanas a la posición", () => {
  const places = [
    { id: "a", latitude: 0, longitude: 0 },
    { id: "b", latitude: 0, longitude: 3 },
    { id: "c", latitude: 0, longitude: 1 },
  ];
  assert.deepEqual(
    nearestPlaces(places, { latitude: 0, longitude: 0 }, 2).map((p) => p.id),
    ["a", "c"],
  );
  assert.equal(nearestPlaces(places, null, 2).length, 2);
});

test("geofenceKind traduce Enter/Exit a arrive/leave", () => {
  assert.equal(geofenceKind(1), "arrive");
  assert.equal(geofenceKind(2), "leave");
  assert.equal(geofenceKind(99), null);
});
