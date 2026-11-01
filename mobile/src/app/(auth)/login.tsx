import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabaseClient } from "../../lib/supabase";
import {
  mapAuthErrorMessage,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "../../features/auth/validation";
import { Banner, Body, Button, Card, CardTitle, Field, colors } from "../../ui/kit";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmation?: string; form?: string }>({});
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setInfo(null);

    const e = validateEmail(email);
    const p = validatePassword(password);
    const c = mode === "signup" ? validatePasswordConfirmation(password, confirmation) : { ok: true as const, value: "" };
    const next = {
      email: e.ok ? undefined : e.error,
      // On sign-in only require a non-empty password: older accounts keep working.
      password: mode === "signup" ? (p.ok ? undefined : p.error) : password ? undefined : "Ingresa tu contraseña.",
      confirmation: c.ok ? undefined : c.error,
    };
    setErrors(next);
    if (next.email || next.password || next.confirmation || !e.ok) return;

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: e.value, password });
        if (error) setErrors({ form: mapAuthErrorMessage(error) });
      } else {
        const { data, error } = await supabase.auth.signUp({ email: e.value, password });
        if (error) {
          setErrors({ form: mapAuthErrorMessage(error) });
        } else if (!data.session) {
          // The project still requires confirming the email, which needs SMTP.
          setInfo("Cuenta creada, pero el proyecto exige confirmar el correo. Desactiva «Confirm email» en Supabase (Authentication → Providers → Email) e inicia sesión.");
          setMode("signin");
        }
      }
    } catch (err) {
      setErrors({ form: mapAuthErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setInfo(null);
    setConfirmation("");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>SALIDA LISTA · ACCESO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </Text>
          <Body>
            {mode === "signin"
              ? "Entra con tu correo y contraseña."
              : "Usa tu correo y elige una contraseña de al menos 8 caracteres."}
          </Body>

          {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
          {info ? <Banner tone="warn">{info}</Banner> : null}

          <Card>
            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="nombre@ejemplo.com"
              error={errors.email}
            />
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              editable={!busy}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              textContentType={mode === "signin" ? "password" : "newPassword"}
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
              onSubmitEditing={() => (mode === "signin" ? void submit() : undefined)}
            />
            {mode === "signup" ? (
              <Field
                label="Repite la contraseña"
                value={confirmation}
                onChangeText={setConfirmation}
                editable={!busy}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.confirmation}
                onSubmitEditing={() => void submit()}
              />
            ) : null}
            <Button
              label={mode === "signin" ? "Entrar" : "Crear cuenta"}
              onPress={() => void submit()}
              loading={busy}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === "signin" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
              disabled={busy}
              onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={styles.switch}
            >
              <Text style={styles.switchText}>
                {mode === "signin" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
              </Text>
            </Pressable>
          </Card>

          <View style={styles.offline}>
            <CardTitle>¿Estás en ruta o sin señal?</CardTitle>
            <Body>El modo guía funciona localmente en este teléfono sin iniciar sesión ni tener conexión.</Body>
            <Button label="Usar modo guía sin cuenta" variant="ghost" disabled={busy} onPress={() => router.push("/guia")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, gap: 16, maxWidth: 520, width: "100%", alignSelf: "center" },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.8, color: colors.muted },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink, letterSpacing: -0.8 },
  switch: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.ink, fontWeight: "600", textDecorationLine: "underline" },
  offline: { padding: 20, backgroundColor: "#EAF0E4", borderRadius: 18, gap: 10 },
});
