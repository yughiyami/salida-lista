import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export function SupabaseConfigErrorScreen({ errors }: { errors: string[] }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CONFIGURACIÓN PENDIENTE</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Falta configurar Supabase
        </Text>
        <Text style={styles.subtitle}>
          Para usar las funciones de cuenta y círculos, define las variables de
          entorno públicas en tu archivo local{" "}
          <Text style={styles.code}>mobile/.env</Text>.
        </Text>

        <View accessibilityRole="alert" style={styles.alertCard}>
          <Text style={styles.cardTitle}>Variables requeridas</Text>
          {errors.map((err, index) => (
            <Text key={index} style={styles.errorItem}>
              • {err}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cómo configurarlo</Text>
          <Text style={styles.step}>
            1. Copia <Text style={styles.code}>mobile/.env.example</Text> a{" "}
            <Text style={styles.code}>mobile/.env</Text>.
          </Text>
          <Text style={styles.step}>
            2. Completa <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text>{" "}
            y <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_KEY</Text> con los
            datos de tu proyecto en Supabase.
          </Text>
          <Text style={styles.step}>
            3. Reinicia Metro (<Text style={styles.code}>npx expo start -c</Text>
            ).
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modo guía offline disponible</Text>
          <Text style={styles.step}>
            El modo guía de campo funciona localmente con SQLite y mapas
            integrados sin necesidad de cuenta ni conexión.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar modo guía sin cuenta"
            onPress={() => router.push("/guia")}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Usar modo guía sin cuenta</Text>
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
    gap: 16,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3EBD9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "#755420",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#163F35",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5B665F",
  },
  alertCard: {
    padding: 18,
    backgroundColor: "#F3EBD9",
    borderLeftWidth: 3,
    borderLeftColor: "#C18A34",
    borderRadius: 14,
    gap: 8,
  },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D2C5",
    borderRadius: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#163F35",
  },
  errorItem: {
    fontSize: 13,
    lineHeight: 20,
    color: "#755420",
  },
  step: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334D41",
  },
  code: {
    fontWeight: "700",
    color: "#163F35",
  },
  button: {
    marginTop: 4,
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
    color: "#FFFDF8",
    fontSize: 15,
    fontWeight: "700",
  },
});
