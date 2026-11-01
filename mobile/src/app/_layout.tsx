import { useState } from "react";
import { Stack, usePathname } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { initializeDatabase } from "../data/database";
import { getSupabaseEnv } from "../lib/env";
import "../lib/supabase";
import { SupabaseConfigErrorScreen } from "../ui/SupabaseConfigErrorScreen";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pathname = usePathname();
  const supabaseEnv = getSupabaseEnv();
  const isGuideRoute = pathname === "/guia" || pathname.startsWith("/guia/");

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {error ? (
          <View style={styles.error}>
            <Text accessibilityRole="alert">
              No pudimos abrir los datos locales. Tus registros no se borrarán.{" "}
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setAttempt((n) => n + 1);
                setError(null);
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <SQLiteProvider
            key={attempt}
            databaseName="salida-lista-demo.db"
            onInit={initializeDatabase}
            onError={(e) => setError(e.message)}
          >
            <View style={styles.container}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#F7F5EF" },
                }}
              />
              {!supabaseEnv.ok && !isGuideRoute ? (
                <View style={StyleSheet.absoluteFill}>
                  <SupabaseConfigErrorScreen errors={supabaseEnv.errors} />
                </View>
              ) : null}
            </View>
          </SQLiteProvider>
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  error: {
    flex: 1,
    padding: 32,
    gap: 20,
    justifyContent: "center",
    backgroundColor: "#F7F5EF",
  },
  retry: {
    minHeight: 52,
    backgroundColor: "#163F35",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#FFFDF8", fontWeight: "600" },
});
