const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/load-ts.cjs");

const {
  normalizeInviteCode,
  validateInviteCode,
  formatInviteCode,
  validateCircleName,
  validatePlaceName,
  mapCircleError,
} = require("../src/features/circles/validation.ts");

test("normaliza el código de invitación: mayúsculas y sin separadores", () => {
  assert.equal(normalizeInviteCode(" abcd-efgh "), "ABCDEFGH");
  assert.equal(normalizeInviteCode("ab cd ef 23"), "ABCDEF23");
});

test("valida 8 caracteres del alfabeto sin ambiguos (sin 0, O, 1, I)", () => {
  assert.deepEqual(validateInviteCode("abcd-efgh"), { ok: true, value: "ABCDEFGH" });
  assert.equal(validateInviteCode("ABC").ok, false);
  assert.equal(validateInviteCode("ABCDEFG0").ok, false);
  assert.equal(validateInviteCode("ABCDEFGI").ok, false);
  assert.equal(validateInviteCode("").ok, false);
});

test("formatInviteCode agrupa en bloques de cuatro", () => {
  assert.equal(formatInviteCode("ABCDEFGH"), "ABCD-EFGH");
  assert.equal(formatInviteCode("abc"), "ABC");
});

test("valida el nombre del círculo entre 2 y 40 caracteres", () => {
  assert.deepEqual(validateCircleName("  Familia   Pérez "), {
    ok: true,
    value: "Familia Pérez",
  });
  assert.equal(validateCircleName("A").ok, false);
  assert.equal(validateCircleName("x".repeat(41)).ok, false);
});

test("valida el nombre del lugar entre 2 y 40 caracteres", () => {
  assert.equal(validatePlaceName("Casa").ok, true);
  assert.equal(validatePlaceName(" ").ok, false);
});

test("traduce errores del servidor a mensajes en español", () => {
  assert.match(mapCircleError({ message: "invalid_invite_code" }), /código/i);
  assert.match(mapCircleError({ message: "too_many_attempts" }), /intentos/i);
  assert.match(mapCircleError({ message: "circle_full" }), /lleno/i);
  assert.match(mapCircleError({ message: "circle_limit_reached" }), /límite/i);
  assert.match(mapCircleError(new Error("Network request failed")), /conexión/i);
  assert.match(mapCircleError(undefined), /inténtalo/i);
});
