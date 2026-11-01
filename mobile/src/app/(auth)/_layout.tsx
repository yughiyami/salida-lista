import { Stack } from "expo-router";
import { useSession } from "../../features/auth/useSession";

export default function AuthLayout() {
  const session = useSession((s) => s.session);
  const isAuthenticated = Boolean(session?.user);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F7F5EF" },
      }}
    >
      <Stack.Protected
        guard={!isAuthenticated}
        redirectTo="/(auth)/perfil"
      >
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected
        guard={isAuthenticated}
        redirectTo="/(auth)/login"
      >
        <Stack.Screen name="perfil" />
      </Stack.Protected>
    </Stack>
  );
}
