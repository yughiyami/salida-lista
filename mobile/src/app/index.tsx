import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "../features/auth/useSession";

export default function Index() {
  const session = useSession((s) => s.session);
  const profile = useSession((s) => s.profile);
  const isInitialized = useSession((s) => s.isInitialized);
  const isLoadingProfile = useSession((s) => s.isLoadingProfile);

  if (!isInitialized || isLoadingProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#163F35" size="large" />
      </View>
    );
  }

  const isAuthenticated = Boolean(session?.user);
  const hasCompletedProfile = Boolean(
    isAuthenticated &&
      profile?.display_name &&
      profile.display_name.trim().length >= 2,
  );

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasCompletedProfile) {
    return <Redirect href="/(auth)/perfil" />;
  }

  return <Redirect href="/(tabs)/mapa" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5EF",
  },
});
