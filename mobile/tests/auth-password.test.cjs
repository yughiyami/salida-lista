const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/load-ts.cjs");

const {
  validatePassword,
  validatePasswordConfirmation,
  mapAuthErrorMessage,
} = require("../src/features/auth/validation.ts");

test("la contraseña exige entre 8 y 72 caracteres", () => {
  assert.deepEqual(validatePassword("abcdefg1"), { ok: true, value: "abcdefg1" });
  const short = validatePassword("abc123");
  assert.equal(short.ok, false);
  assert.match(short.error, /8 caracteres/);
  const empty = validatePassword("");
  assert.equal(empty.ok, false);
  assert.match(empty.error, /contraseña/i);
  const long = validatePassword("a".repeat(73));
  assert.equal(long.ok, false);
  assert.match(long.error, /72/);
});

test("la contraseña no recorta espacios ni exige símbolos raros", () => {
  assert.deepEqual(validatePassword("mi clave larga"), { ok: true, value: "mi clave larga" });
});

test("la confirmación debe coincidir", () => {
  assert.equal(validatePasswordConfirmation("abcdefg1", "abcdefg1").ok, true);
  const bad = validatePasswordConfirmation("abcdefg1", "abcdefg2");
  assert.equal(bad.ok, false);
  assert.match(bad.error, /no coinciden/i);
});

test("traduce los errores de contraseña de Supabase", () => {
  assert.match(mapAuthErrorMessage({ message: "Invalid login credentials" }), /correo o contraseña/i);
  assert.match(mapAuthErrorMessage({ message: "User already registered" }), /ya existe una cuenta/i);
  assert.match(mapAuthErrorMessage({ message: "Email not confirmed" }), /confirm/i);
  assert.match(
    mapAuthErrorMessage({ message: "Password should be at least 8 characters." }),
    /8 caracteres/,
  );
});
