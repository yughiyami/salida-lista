import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { saveExpoPushToken } from "../circles/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("circle", {
    name: "Mi círculo",
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync("sos", {
    name: "SOS",
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    bypassDnd: true,
  });
}

/**
 * Registers the device for push. Returns a reason string when it cannot, so the
 * app keeps working through realtime updates. Android pushes additionally need
 * FCM credentials in the EAS project (see docs/guias/PUSH-FCM.md).
 */
export async function registerForPush(userId: string): Promise<string | null> {
  try {
    if (!Device.isDevice) return "Las notificaciones push necesitan un teléfono real.";
    await ensureChannels();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return "Permiso de notificaciones denegado.";

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      return "Falta vincular el proyecto de EAS (projectId) para las notificaciones push.";
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await saveExpoPushToken(userId, token.data, Platform.OS);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudo registrar el dispositivo para push.";
  }
}
