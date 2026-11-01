import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabaseClient } from "../../lib/supabase";
import { useSession } from "../../features/auth/useSession";
import {
  mapAuthErrorMessage,
  normalizeEmail,
  validateOtpCode,
} from "../../features/auth/validation";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = normalizeEmail(typeof params.email === "string" ? params.email : "");
  const fetchProfile = useSession((s) => s.fetchProfile);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleVerify = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);

    if (!email) {
      setError("Falta el correo electrónico. Vuelve atrás e ingrésalo de nuevo.");
      return;
    }

    const validated = validateOtpCode(code);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: validated.value,
        type: "email",
      });

      if (verifyError) {
        setError(mapAuthErrorMessage(verifyError));
        return;
      }

      const userId = data.user?.id ?? data.session?.user?.id;
      if (userId) {
        const profile = await fetchProfile(userId);
        if (profile?.display_name && profile.display_name.trim().length >= 2) {
          router.replace("/(tabs)/mapa");
        } else {
          router.replace("/(auth)/perfil");
        }
      }
    } catch (e) {
      setError(mapAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (busy || !email) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (resendError) {
        setError(mapAuthErrorMessage(resendError));
        return;
      }
      setNotice("Enviamos un nuevo código de 6 dígitos a tu correo.");
    } catch (e) {
      setError(mapAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>VERIFICACIÓN POR CORREO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Ingresa tu código
          </Text>
          <Text style={styles.subtitle}>
            Escribe el código de 6 dígitos enviado a{" "}
            <Text style={styles.emailHighlight}>{email || "tu correo"}</Text>.
          </Text>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {notice ? (
            <View accessibilityLiveRegion="polite" style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Código de 6 dígitos</Text>
            <TextInput
              accessibilityLabel="Código de 6 dígitos"
              value={code}
              onChangeText={setCode}
              editable={!busy}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor="#777F77"
              style={styles.input}
              onSubmitEditing={() => void handleVerify()}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verificar código"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => void handleVerify()}
              style={({ pressed }) => [
                styles.primaryButton,
                busy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFDF8" />
              ) : (
                <Text style={styles.primaryButtonText}>Verificar código</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reenviar código"
              disabled={busy}
              onPress={() => void handleResend()}
              style={({ pressed }) => [
                styles.secondaryButton,
                busy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Reenviar código</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar correo"
              disabled={busy}
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace("/(auth)/login")
              }
              style={styles.textButton}
            >
              <Text style={styles.textButtonLabel}>Cambiar correo</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 16,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "#5B665F",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#163F35",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5B665F",
  },
  emailHighlight: {
    fontWeight: "700",
    color: "#163F35",
  },
  errorBox: {
    padding: 15,
    backgroundColor: "#F6E4DC",
    borderRadius: 12,
  },
  errorText: {
    color: "#8D3927",
    fontSize: 13,
    lineHeight: 20,
  },
  noticeBox: {
    padding: 15,
    backgroundColor: "#EAF0E4",
    borderRadius: 12,
  },
  noticeText: {
    color: "#334D41",
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D2C5",
    borderRadius: 18,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#163F35",
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#BCCAB4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFDF8",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 6,
    color: "#163F35",
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: "#163F35",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFDF8",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D8D2C5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#163F35",
    fontSize: 14,
    fontWeight: "600",
  },
  textButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    color: "#5B665F",
    fontSize: 13,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.78,
  },
});
