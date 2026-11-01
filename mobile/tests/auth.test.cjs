const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");

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

const {
  normalizeEmail,
  validateEmail,
  normalizeOtpCode,
  validateOtpCode,
  normalizeDisplayName,
  validateDisplayName,
  mapAuthErrorMessage,
} = require("../src/features/auth/validation.ts");

test("normaliza email a minúsculas y sin espacios alrededor", () => {
  assert.equal(normalizeEmail("  Daniel.Marron@NextTrip.PE  "), "daniel.marron@nexttrip.pe");
  const valid = validateEmail("  GUIAS@SalidaLista.org ");
  assert.deepEqual(valid, { ok: true, value: "guias@salidalista.org" });
});

test("rechaza emails vacíos o con formato inválido", () => {
  const empty = validateEmail("   ");
  assert.equal(empty.ok, false);
  assert.match(empty.error, /correo electrónico/i);

  const malformed = validateEmail("usuario-sin-dominio@");
  assert.equal(malformed.ok, false);
  assert.match(malformed.error, /correo electrónico válido/i);
});

test("valida código OTP de exactamente 6 dígitos numéricos", () => {
  assert.equal(normalizeOtpCode(" 123 456 "), "123456");
  assert.deepEqual(validateOtpCode(" 048 912 "), { ok: true, value: "048912" });

  const shortCode = validateOtpCode("12345");
  assert.equal(shortCode.ok, false);
  assert.match(shortCode.error, /6 dígitos/i);

  const longCode = validateOtpCode("1234567");
  assert.equal(longCode.ok, false);

  const alphaCode = validateOtpCode("12a456");
  assert.equal(alphaCode.ok, false);
  assert.match(alphaCode.error, /6 dígitos numéricos/i);
});

test("valida display_name entre 2 y 40 caracteres y normaliza espacios", () => {
  assert.equal(normalizeDisplayName("  Daniel   Marrón  "), "Daniel Marrón");
  assert.deepEqual(validateDisplayName("  Daniel   Marrón  "), {
    ok: true,
    value: "Daniel Marrón",
  });

  const minBound = validateDisplayName("Al");
  assert.deepEqual(minBound, { ok: true, value: "Al" });

  const maxBoundName = "A".repeat(40);
  assert.deepEqual(validateDisplayName(maxBoundName), {
    ok: true,
    value: maxBoundName,
  });

  const tooShort = validateDisplayName(" A ");
  assert.equal(tooShort.ok, false);
  assert.match(tooShort.error, /al menos 2 caracteres/i);

  const tooLong = validateDisplayName("A".repeat(41));
  assert.equal(tooLong.ok, false);
  assert.match(tooLong.error, /40 caracteres/i);
});

test("traduce errores de red, código expirado y rate limit al español", () => {
  assert.match(
    mapAuthErrorMessage(new Error("Network request failed")),
    /sin conexión a internet/i,
  );
  assert.match(
    mapAuthErrorMessage({ message: "Token has expired or is invalid" }),
    /inválido o ha expirado/i,
  );
  assert.match(
    mapAuthErrorMessage(new Error("For security purposes, you can only request this after 60 seconds")),
    /demasiados intentos/i,
  );
});

