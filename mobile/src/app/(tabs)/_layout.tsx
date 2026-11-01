import { useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Map, MapPin, Settings, Users } from "lucide-react-native";
import { useSession } from "../../features/auth/useSession";
import { useRealtimeSync } from "../../features/circles/hooks";
import type { FeedMessage } from "../../features/circles/types";
import { SharingController } from "../../features/location/SharingController";
import { registerForPush } from "../../features/push/register";

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

export default function TabsLayout() {
  return (
    <>
      <AuthedServices />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "#F7F5EF" },
          tabBarActiveTintColor: "#163F35",
          tabBarInactiveTintColor: "#5B665F",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#D8D2C5",
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="mapa"
          options={{
            title: "Mapa",
            tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="circulos"
          options={{
            title: "Círculos",
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="lugares"
          options={{
            title: "Lugares",
            tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="ajustes"
          options={{
            title: "Ajustes",
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
