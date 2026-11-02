import { useCallback, useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Map, MapPin, Settings, Users, type LucideIcon } from "lucide-react-native";
import { useSession } from "../../features/auth/useSession";
import { useRealtimeSync } from "../../features/circles/hooks";
import type { FeedMessage } from "../../features/circles/types";
import { SharingController } from "../../features/location/SharingController";
import { registerForPush } from "../../features/push/register";
import { colors, fonts } from "../../ui/theme";

function AuthedServices() {
  const router = useRouter();
  const userId = useSession((s) => s.user?.id);

  const onFeedMessage = useCallback(
    (message: FeedMessage) => {
      if (message.kind === "sos" && message.user_id !== userId) {
        Alert.alert("SOS", message.body, [
          { text: "Cerrar", style: "cancel" },
          {
            text: "Ver chat",
            onPress: () =>
              router.push({ pathname: "/chat/[id]", params: { id: message.circle_id } }),
          },
        ]);
      }
    },
    [router, userId],
  );
  useRealtimeSync(onFeedMessage);

  // Push is best effort: without FCM credentials the app still gets realtime updates.
  useEffect(() => {
    if (userId) void registerForPush(userId);
  }, [userId]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { circleId?: string } | undefined;
      if (data?.circleId) {
        router.push({ pathname: "/chat/[id]", params: { id: data.circleId } });
      }
    });
    return () => sub.remove();
  }, [router]);

  return <SharingController />;
}

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View style={[tab.pill, focused && tab.pillOn]}>
      <Icon color={focused ? colors.spruceDeep : colors.inkSoft} size={22} strokeWidth={focused ? 2.6 : 2.1} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <>
      <AuthedServices />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.ground },
          tabBarActiveTintColor: colors.spruceDeep,
          tabBarInactiveTintColor: colors.inkSoft,
          tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, marginTop: 2 },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            height: 70,
            paddingTop: 8,
            paddingBottom: 10,
          },
        }}
      >
        <Tabs.Screen
          name="mapa"
          options={{
            title: "Mapa",
            tabBarIcon: ({ focused }) => <TabIcon Icon={Map} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="circulos"
          options={{
            title: "Círculos",
            tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="lugares"
          options={{
            title: "Lugares",
            tabBarIcon: ({ focused }) => <TabIcon Icon={MapPin} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ajustes"
          options={{
            title: "Ajustes",
            tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} focused={focused} />,
          }}
        />
      </Tabs>
    </>
  );
}

const tab = StyleSheet.create({
  pill: { width: 58, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pillOn: { backgroundColor: colors.lime },
});
