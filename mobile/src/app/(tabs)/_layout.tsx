import { Tabs } from "expo-router";
import { Map, MapPin, Settings, Users } from "lucide-react-native";

export default function TabsLayout() {
  return (
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
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
