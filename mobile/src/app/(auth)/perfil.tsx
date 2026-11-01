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
import { useSession, type UserProfile } from "../../features/auth/useSession";
import {
  mapAuthErrorMessage,
  validateDisplayName,
} from "../../features/auth/validation";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const signOut = useSession((s) => s.signOut);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (busy) return;
    setError(null);

    const validated = validateDisplayName(displayName);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    if (!user?.id) {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: validated.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id, display_name, avatar_url, created_at, updated_at")
        .single<UserProfile>();

      if (upsertError || !data) {
        setError(
          mapAuthErrorMessage(
            upsertError ?? new Error("No se pudo guardar el perfil."),
          ),
        );
        return;
      }

      setProfile(data);
      router.replace("/(tabs)/mapa");
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
          <Text style={styles.eyebrow}>PERFIL DE USUARIO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Tu nombre visible
          </Text>
          <Text style={styles.subtitle}>
            Así te identificarán las personas con quienes compartas tus círculos
            en Salida Lista.
          </Text>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Nombre para mostrar (2 a 40 caracteres)</Text>
            <TextInput
              accessibilityLabel="Nombre para mostrar"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!busy}
              maxLength={40}
              placeholder="Ej. Ana Quispe"
              placeholderTextColor="#777F77"
              style={styles.input}
              onSubmitEditing={() => void handleSaveProfile()}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar perfil"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => void handleSaveProfile()}
              style={({ pressed }) => [
                styles.primaryButton,
                busy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFDF8" />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar perfil</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              disabled={busy}
              onPress={() => void signOut()}
              style={styles.textButton}
            >
              <Text style={styles.textButtonLabel}>Cerrar sesión</Text>
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
