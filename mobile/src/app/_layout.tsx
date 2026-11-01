import { useEffect, useState } from "react";
import { Stack, usePathname } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { initializeDatabase } from "../data/database";
import { useSession } from "../features/auth/useSession";
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

  const session = useSession((s) => s.session);
  const profile = useSession((s) => s.profile);
  const isInitialized = useSession((s) => s.isInitialized);
  const isLoadingProfile = useSession((s) => s.isLoadingProfile);
  const initialize = useSession((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const isAuthenticated = Boolean(session?.user);
  const hasCompletedProfile = Boolean(
    isAuthenticated &&
      profile?.display_name &&
      profile.display_name.trim().length >= 2,
  );
  const isAuthBootstrapping =
    supabaseEnv.ok && (!isInitialized || isLoadingProfile);

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
              >
                <Stack.Screen name="guia" />
                <Stack.Screen name="index" />
                <Stack.Protected
                  guard={hasCompletedProfile}
                  redirectTo={
                    isAuthenticated ? "/(auth)/perfil" : "/(auth)/login"
                  }
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="circulo/[id]" />
                  <Stack.Screen name="chat/[id]" />
                  <Stack.Screen name="lugar/nuevo" />
                </Stack.Protected>
                <Stack.Protected
                  guard={!hasCompletedProfile}
                  redirectTo="/(tabs)/mapa"
                >
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>

              {!supabaseEnv.ok && !isGuideRoute ? (
                <View style={StyleSheet.absoluteFill}>
                  <SupabaseConfigErrorScreen errors={supabaseEnv.errors} />
                </View>
              ) : isAuthBootstrapping && !isGuideRoute ? (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                  <ActivityIndicator color="#163F35" size="large" />
                  <Text style={styles.loadingText}>Verificando sesión…</Text>
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
  loadingOverlay: {
    backgroundColor: "#F7F5EF",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#5B665F",
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
