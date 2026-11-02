import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Compass, LogIn, UserPlus } from "lucide-react-native";
import { getSupabaseClient } from "../../lib/supabase";
import {
  mapAuthErrorMessage,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "../../features/auth/validation";
import { AuthShell } from "../../ui/AuthShell";
import { Banner, Button, Card, Field, Segmented, Text, colors, radius } from "../../ui/kit";

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
    <AuthShell
      title={mode === "signin" ? "Tu gente, a salvo en el mapa." : "Crea tu cuenta en un minuto."}
      subtitle="Círculos privados, ubicación en vivo y avisos cuando llegan bien."
    >
      <Segmented
        value={mode}
        onChange={switchMode}
        options={[
          { value: "signin", label: "Entrar" },
          { value: "signup", label: "Crear cuenta" },
        ]}
      />

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
          icon={mode === "signin" ? LogIn : UserPlus}
          onPress={() => void submit()}
          loading={busy}
        />
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Usar modo guía sin cuenta"
        disabled={busy}
        onPress={() => router.push("/guia")}
        style={({ pressed }) => [styles.guide, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.guideIcon}>
          <Compass color={colors.spruceDeep} size={22} strokeWidth={2.3} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">¿En ruta o sin señal?</Text>
          <Text variant="small">Modo guía: funciona sin cuenta y sin internet.</Text>
        </View>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  guide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.spruceTint,
  },
  guideIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
});
