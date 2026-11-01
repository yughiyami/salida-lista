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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabaseClient } from "../../lib/supabase";
import {
  mapAuthErrorMessage,
  validateEmail,
} from "../../features/auth/validation";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (busy) return;
    setError(null);

    const validated = validateEmail(email);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: validated.value,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(mapAuthErrorMessage(otpError));
        return;
      }

      router.push({
        pathname: "/(auth)/verificar",
        params: { email: validated.value },
      });
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
          <Text style={styles.eyebrow}>SALIDA LISTA · ACCESO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Iniciar sesión
          </Text>
          <Text style={styles.subtitle}>
            Te enviaremos un código de 6 dígitos a tu correo electrónico para
            entrar sin contraseña.
          </Text>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="nombre@ejemplo.com"
              placeholderTextColor="#777F77"
              style={styles.input}
              onSubmitEditing={() => void handleSendCode()}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar código de acceso"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => void handleSendCode()}
              style={({ pressed }) => [
                styles.primaryButton,
                busy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFDF8" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Enviar código de acceso
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.offlineCard}>
            <Text style={styles.cardTitle}>¿Estás en ruta o sin señal?</Text>
            <Text style={styles.offlineText}>
              El modo guía funciona localmente en este teléfono sin necesidad de
              iniciar sesión ni tener conexión a internet.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Usar modo guía sin cuenta"
              disabled={busy}
              onPress={() => router.push("/guia")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                Usar modo guía sin cuenta
              </Text>
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
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#BCCAB4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFDF8",
    fontSize: 16,
    color: "#163F35",
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
  offlineCard: {
    padding: 20,
    backgroundColor: "#EAF0E4",
    borderRadius: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#163F35",
  },
  offlineText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334D41",
  },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#163F35",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 2,
  },
  secondaryButtonText: {
    color: "#163F35",
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.78,
  },
});
