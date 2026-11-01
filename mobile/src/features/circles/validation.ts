import type { ValidationResult } from "../auth/validation";

// Must match private.generate_invite_code() in the database.
const INVITE_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function validateInviteCode(raw: string): ValidationResult<string> {
  const code = normalizeInviteCode(raw);
  if (!code) return { ok: false, error: "Ingresa el código de invitación." };
  if (!INVITE_ALPHABET.test(code)) {
    return {
      ok: false,
      error: "El código tiene 8 caracteres (letras y números, sin 0, O, 1 ni I).",
    };
  }
  return { ok: true, value: code };
}

export function formatInviteCode(code: string): string {
  const clean = normalizeInviteCode(code);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

function validateName(raw: string, label: string): ValidationResult<string> {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) {
    return { ok: false, error: `${label} debe tener al menos 2 caracteres.` };
  }
  if (name.length > 40) {
    return { ok: false, error: `${label} no puede superar los 40 caracteres.` };
  }
  return { ok: true, value: name };
}

export const validateCircleName = (raw: string) =>
  validateName(raw, "El nombre del círculo");
export const validatePlaceName = (raw: string) =>
  validateName(raw, "El nombre del lugar");

export function mapCircleError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";
  const lower = message.toLowerCase();

  if (lower.includes("network request failed") || lower.includes("failed to fetch")) {
    return "Sin conexión a internet. Inténtalo cuando vuelvas a tener red.";
  }
  if (lower.includes("invalid_invite_code")) {
    return "Ese código no existe. Revisa que esté bien escrito.";
  }
  if (lower.includes("too_many_attempts")) {
    return "Demasiados intentos con códigos incorrectos. Espera una hora y vuelve a probar.";
  }
  if (lower.includes("circle_full")) {
    return "Este círculo está lleno (máximo 20 personas).";
  }
  if (lower.includes("circle_limit_reached")) {
    return "Llegaste al límite de 5 círculos propios.";
  }
  if (lower.includes("owner_only")) {
    return "Solo quien creó el círculo puede hacer esto.";
  }
  if (lower.includes("not_a_member")) {
    return "Ya no formas parte de este círculo.";
  }
  if (lower.includes("invalid_circle_name")) {
    return "El nombre del círculo debe tener entre 2 y 40 caracteres.";
  }
  return "No pudimos completar la acción. Inténtalo de nuevo.";
}
