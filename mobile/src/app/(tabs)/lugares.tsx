import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlacesTabScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Próximamente</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Lugares
        </Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Configura zonas de interés y puntos de encuentro frecuentes para
            tus círculos.
          </Text>
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
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5B665F",
  },
});
