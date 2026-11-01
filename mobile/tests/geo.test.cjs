const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/load-ts.cjs");

const {
  haversineMeters,
  isInsideRadius,
  formatLastSeen,
  isStale,
  formatBattery,
  initials,
  computeBounds,
} = require("../src/domain/geo.ts");

const arequipa = { latitude: -16.409, longitude: -71.5375 };

test("haversine devuelve 0 para el mismo punto y ~111 km por grado de latitud", () => {
  assert.equal(haversineMeters(arequipa, arequipa), 0);
  const d = haversineMeters(
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 0 },
  );
  assert.ok(Math.abs(d - 111_195) < 300, `distancia inesperada: ${d}`);
});

test("isInsideRadius incluye el borde y excluye lo que queda fuera", () => {
  const near = { latitude: -16.409, longitude: -71.5365 }; // ~107 m
  assert.equal(isInsideRadius(near, arequipa, 150), true);
  assert.equal(isInsideRadius(near, arequipa, 100), false);
});

test("formatLastSeen usa español y escala de unidades", () => {
  const now = Date.UTC(2026, 10, 1, 12, 0, 0);
  assert.equal(formatLastSeen(now - 10_000, now), "ahora");
  assert.equal(formatLastSeen(now - 5 * 60_000, now), "hace 5 min");
  assert.equal(formatLastSeen(now - 3 * 3_600_000, now), "hace 3 h");
  assert.equal(formatLastSeen(now - 2 * 86_400_000, now), "hace 2 d");
  assert.equal(formatLastSeen(now + 5000, now), "ahora");
});

test("isStale marca posiciones con más de 10 minutos", () => {
  const now = 1_000_000_000;
  assert.equal(isStale(now - 9 * 60_000, now), false);
  assert.equal(isStale(now - 11 * 60_000, now), true);
});

test("formatBattery redondea y avisa si está cargando", () => {
  assert.equal(formatBattery(0.824, false), "82 %");
  assert.equal(formatBattery(0.5, true), "50 % · cargando");
  assert.equal(formatBattery(null, null), "Batería desconocida");
});

test("initials toma hasta dos iniciales en mayúscula", () => {
  assert.equal(initials("ana maría pérez"), "AM");
  assert.equal(initials("  luis "), "L");
  assert.equal(initials(""), "?");
});

test("computeBounds devuelve [oeste, sur, este, norte] o null sin puntos", () => {
  assert.equal(computeBounds([]), null);
  assert.deepEqual(
    computeBounds([
      { latitude: -16.4, longitude: -71.5 },
      { latitude: -16.5, longitude: -71.6 },
    ]),
    [-71.6, -16.5, -71.5, -16.4],
  );
});

test("circlePolygon genera un anillo cerrado cuyo radio coincide con el pedido", () => {
  const { circlePolygon } = require("../src/domain/geo.ts");
  const center = { latitude: -16.409, longitude: -71.5375 };
  const ring = circlePolygon(center, 200, 32);
  assert.equal(ring.length, 33);
  assert.deepEqual(ring[0], ring[32]);
  for (const [lng, lat] of ring) {
    const d = haversineMeters(center, { latitude: lat, longitude: lng });
    assert.ok(Math.abs(d - 200) < 2, `radio fuera de rango: ${d}`);
  }
});
