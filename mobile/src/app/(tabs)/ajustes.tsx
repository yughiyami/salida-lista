import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../features/auth/useSession";

export default function SettingsTabScreen() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const signOut = useSession((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Ajustes
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mi cuenta</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nombre visible</Text>
            <Text style={styles.value}>
              {profile?.display_name ?? "Sin configurar"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.value}>
              {user?.email ?? "No disponible"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            disabled={signingOut}
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [
              styles.signOutButton,
              signingOut && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signOutText}>
              {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Preferencias de ubicación</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Próximamente</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Próximamente podrás gestionar alertas de lugares y preferencias de
            compartir ubicación por círculo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Operación en campo</Text>
          <Text style={styles.description}>
            Accede al modo de guía para preparar salidas, revisar asistencia y
            registrar eventos locales sin conexión.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Modo guía (offline)"
            onPress={() => router.push("/guia")}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Modo guía (offline)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  container: {
    padding: 24,
    gap: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    backgroundColor: "#E4EAD9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#163F35",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#163F35",
    letterSpacing: -0.8,
  },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D2C5",
    borderRadius: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#163F35",
  },
  infoRow: {
    gap: 3,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EFECE4",
  },
  label: {
    fontSize: 12,
    color: "#5B665F",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#163F35",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5B665F",
  },
  button: {
    minHeight: 52,
    backgroundColor: "#163F35",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  signOutButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#8D3927",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  signOutText: {
    color: "#8D3927",
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
