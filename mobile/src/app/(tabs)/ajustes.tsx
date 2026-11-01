import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsTabScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Próximamente</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Ajustes
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta y privacidad</Text>
          <Text style={styles.description}>
            Próximamente podrás gestionar tu perfil, permisos de ubicación y
            preferencias de cuenta desde esta pantalla.
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 14,
  },
  badge: {
    alignSelf: "flex-start",
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
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
