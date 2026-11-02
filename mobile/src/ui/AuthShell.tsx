import type { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text, colors, radius } from "./kit";
import { Topo } from "./Topo";

/** Shared frame for sign-in and profile: a spruce hero with contour lines over a white sheet. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Topo color={colors.lime} opacity={0.2} rings={12} seed={3} />
            <View style={styles.brand}>
              <Image
                source={require("../../assets/brand/salida-lista-mark.png")}
                style={styles.mark}
                accessibilityLabel="Salida Lista"
              />
              <Text variant="heading" style={{ color: colors.white }}>
                Salida Lista
              </Text>
            </View>
            <Text accessibilityRole="header" variant="display" style={{ color: colors.white, fontSize: 36, lineHeight: 40 }}>
              {title}
            </Text>
            <Text variant="body" style={{ color: "#B7D3C6" }}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.sheet}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.spruceDeep },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 44, gap: 12, overflow: "hidden" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  mark: { width: 40, height: 40, borderRadius: 12 },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.ground,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    marginTop: -24,
    padding: 22,
    gap: 16,
  },
});
