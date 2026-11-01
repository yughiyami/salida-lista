import { z } from "zod";

export type ValidationResult<T = string> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export const emailSchema = z
  .string()
  .min(1, { message: "Ingresa tu correo electrónico." })
  .email({ message: "Ingresa un correo electrónico válido." });

export function validateEmail(raw: string): ValidationResult<string> {
  const normalized = normalizeEmail(raw);
  const parsed = emailSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Ingresa un correo electrónico válido.",
    };
  }
  return { ok: true, value: parsed.data };
}

export function normalizeOtpCode(raw: string): string {
  return raw.replace(/\s+/g, "");
}

export const otpCodeSchema = z
  .string()
  .min(1, { message: "Ingresa el código de 6 dígitos." })
  .regex(/^\d{6}$/, {
    message: "El código debe tener exactamente 6 dígitos numéricos.",
  });

export function validateOtpCode(raw: string): ValidationResult<string> {
  const normalized = normalizeOtpCode(raw);
  const parsed = otpCodeSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "El código debe tener exactamente 6 dígitos numéricos.",
    };
  }
  return { ok: true, value: parsed.data };
}

// Supabase hashes with bcrypt, which ignores everything past 72 bytes.
export function validatePassword(raw: string): ValidationResult<string> {
  if (raw.length === 0) {
    return { ok: false, error: "Ingresa tu contraseña." };
  }
  if (raw.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (new TextEncoder().encode(raw).length > 72) {
    return { ok: false, error: "La contraseña no puede superar los 72 caracteres." };
  }
  return { ok: true, value: raw };
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationResult<string> {
  if (password !== confirmation) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }
  return { ok: true, value: confirmation };
}

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export const displayNameSchema = z
  .string()
  .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
  .max(40, { message: "El nombre no puede superar los 40 caracteres." });

export function validateDisplayName(raw: string): ValidationResult<string> {
  const normalized = normalizeDisplayName(raw);
  const parsed = displayNameSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "El nombre debe tener entre 2 y 40 caracteres.",
    };
  }
  return { ok: true, value: parsed.data };
}

export function mapAuthErrorMessage(error: unknown): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : typeof error === "string"
          ? error
          : "";

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("network request failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("offline")
  ) {
    return "Sin conexión a internet. Verifica tu red o usa el modo guía offline.";
  }

  if (
    lower.includes("token has expired") ||
    lower.includes("otp_expired") ||
    lower.includes("invalid token") ||
    lower.includes("token is invalid") ||
    lower.includes("invalid otp")
  ) {
    return "El código es inválido o ha expirado. Solicita uno nuevo e inténtalo otra vez.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("too many requests") ||
    lower.includes("for security purposes")
  ) {
    return "Has realizado demasiados intentos. Espera un momento antes de volver a solicitar un código.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "Ya existe una cuenta con ese correo. Inicia sesión.";
  }

  if (lower.includes("email not confirmed")) {
    return "Tu correo aún no está confirmado. Pide a quien administra la app que desactive la confirmación de correo.";
  }

  if (lower.includes("password should be at least") || lower.includes("weak_password")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "El correo electrónico no es válido.";
  }

  if (rawMessage.trim().length > 0) {
    return rawMessage;
  }

  return "No pudimos completar la autenticación. Intenta nuevamente.";
}
