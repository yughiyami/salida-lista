import { z } from "zod";

const supabaseEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url({
    message:
      "EXPO_PUBLIC_SUPABASE_URL debe ser una URL válida (por ejemplo, https://tu-proyecto.supabase.co).",
  }),
  EXPO_PUBLIC_SUPABASE_KEY: z.string().min(10, {
    message:
      "EXPO_PUBLIC_SUPABASE_KEY debe contener la clave pública (anon/publishable) de tu proyecto Supabase.",
  }),
});

export type SupabaseEnvResult =
  | {
      ok: true;
      data: {
        url: string;
        key: string;
      };
    }
  | {
      ok: false;
      errors: string[];
    };

export function getSupabaseEnv(): SupabaseEnvResult {
  const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const rawKey = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim() ?? "";

  const parsed = supabaseEnvSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: rawUrl,
    EXPO_PUBLIC_SUPABASE_KEY: rawKey,
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    ok: true,
    data: {
      url: parsed.data.EXPO_PUBLIC_SUPABASE_URL,
      key: parsed.data.EXPO_PUBLIC_SUPABASE_KEY,
    },
  };
}

export const isSupabaseConfigured = getSupabaseEnv().ok;
