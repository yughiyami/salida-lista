import { useState } from "react";
import { Alert, Share, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import { keys, useUserSettings } from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import { describePause, PAUSE_OPTIONS } from "../../features/location/pause";
import {
  ensureBackgroundPermission,
  ensureForegroundPermission,
  stopBackgroundUpdates,
  stopGeofences,
} from "../../features/location/sharing";
import { clearLocationData } from "../../features/location/store";
import { registerForPush } from "../../features/push/register";
import { Bell, Download, MapPinned, ShieldCheck, Trash2, Route } from "lucide-react-native";
import { Avatar, Banner, Body, Button, Card, CardTitle, Pill, Screen, Text, colors } from "../../ui/kit";
import { useNow } from "../../ui/useNow";

async function stopAllLocationWork() {
  try {
    await stopBackgroundUpdates();
    await stopGeofences();
    await clearLocationData();
  } catch {
    // Nothing running or the module is unavailable: safe to ignore.
  }
}

export default function SettingsTabScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const signOut = useSession((s) => s.signOut);
  const settings = useUserSettings();
  const now = useNow();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "danger" | "warn"; text: string } | null>(null);

  const data = settings.data;
  const consent = Boolean(data?.location_consent_at);
  const background = Boolean(data?.background_consent_at);
  const pause = describePause(data?.sharing_paused_until, now);

  const run = async (key: string, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setNotice(null);
    try {
      await task();
      await qc.invalidateQueries({ queryKey: keys.settings });
    } catch (e) {
      setNotice({ tone: "danger", text: mapCircleError(e) });
    } finally {
      setBusy(null);
    }
  };

  const toggleSharing = (next: boolean) =>
    run("sharing", async () => {
      if (next) {
        if (!(await ensureForegroundPermission())) {
          setNotice({ tone: "danger", text: "El teléfono no tiene el permiso de ubicación. Actívalo en sus ajustes." });
          return;
        }
        await api.updateLocationSettings({ grantLocation: true });
      } else {
        await stopAllLocationWork();
        await api.updateLocationSettings({ grantLocation: false, grantBackground: false });
      }
    });

  const toggleBackground = (next: boolean) => {
    if (!next) {
      void run("background", async () => {
        await stopBackgroundUpdates();
        await stopGeofences();
        await api.updateLocationSettings({ grantBackground: false });
      });
      return;
    }
    // Prominent disclosure required by Google Play before the permission prompt.
    Alert.alert(
      "Ubicación en segundo plano",
      "Salida Lista recogerá tu ubicación aunque la app esté cerrada o no la estés usando, para que tu círculo sepa dónde estás y para avisar cuando llegas o sales de un lugar. Verás una notificación permanente mientras esté activa. Puedes pausarla o apagarla aquí cuando quieras.",
      [
        { text: "Ahora no", style: "cancel" },
        {
          text: "Entiendo, continuar",
          onPress: () =>
            void run("background", async () => {
              if (!(await ensureBackgroundPermission())) {
                setNotice({
                  tone: "warn",
                  text: "Para usarla elige «Permitir todo el tiempo» en los permisos de ubicación del teléfono.",
                });
                return;
              }
              await api.updateLocationSettings({ grantLocation: true, grantBackground: true });
            }),
        },
      ],
    );
  };

  const pauseFor = (minutes: number) =>
    run("pause", () => api.updateLocationSettings({ pauseMinutes: minutes }).then(() => undefined));
  const resume = () =>
    run("pause", () => api.updateLocationSettings({ resume: true }).then(() => undefined));

  const enablePush = () =>
    run("push", async () => {
      if (!user) return;
      const problem = await registerForPush(user.id);
      setNotice(
        problem
          ? { tone: "warn", text: problem }
          : { tone: "info", text: "Notificaciones activadas en este teléfono." },
      );
    });

  const exportData = () =>
    run("export", async () => {
      const json = JSON.stringify(await api.exportMyData(), null, 2);
      await Share.share({ title: "Mis datos de Salida Lista", message: json });
    });

  const confirmDelete = () =>
    Alert.alert(
      "Eliminar mi cuenta",
      "Se borrarán tu perfil, tu ubicación, tu historial y tus mensajes. Esto no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar para siempre",
          style: "destructive",
          onPress: () =>
            void run("delete", async () => {
              await api.deleteMyAccount();
              await stopAllLocationWork();
              qc.clear();
              await signOut();
              router.replace("/(auth)/login");
            }),
        },
      ],
    );

  const handleSignOut = () =>
    run("signout", async () => {
      await stopAllLocationWork();
      qc.clear();
      await signOut();
      router.replace("/(auth)/login");
    });

  return (
    <Screen title="Ajustes" subtitle="Tu cuenta, tu ubicación y tu privacidad.">
      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}

      <Card>
        <View style={styles.account}>
          <Avatar name={profile?.display_name ?? "?"} id={user?.id ?? "me"} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="heading" numberOfLines={1}>{profile?.display_name ?? "Sin configurar"}</Text>
            <Text variant="small" numberOfLines={1}>{user?.email ?? "No disponible"}</Text>
          </View>
        </View>
        <Button label="Cerrar sesión" variant="ghost" onPress={() => void handleSignOut()} loading={busy === "signout"} />
      </Card>

      <Card>
        <View style={styles.titleRow}><MapPinned color={colors.spruce} size={20} strokeWidth={2.3} /><CardTitle>Compartir ubicación</CardTitle></View>
        <ToggleRow
          label="Compartir mi ubicación con mis círculos"
          value={consent}
          disabled={busy !== null || !settings.isSuccess}
          onChange={(v) => void toggleSharing(v)}
        />
        {consent ? (
          <>
            <Pill tone={pause.paused ? "warn" : "live"}>{pause.label}</Pill>
            {pause.paused ? (
              <Button label="Reanudar ahora" onPress={() => void resume()} loading={busy === "pause"} />
            ) : (
              <>
                <Body>Pausar temporalmente:</Body>
                <View style={styles.row}>
                  {PAUSE_OPTIONS.map((o) => (
                    <View key={o.minutes} style={{ flexBasis: "47%", flexGrow: 1 }}>
                      <Button label={o.label} variant="secondary" onPress={() => void pauseFor(o.minutes)} disabled={busy !== null} />
                    </View>
                  ))}
                </View>
              </>
            )}
            <ToggleRow
              label="Seguir compartiendo con la app cerrada (segundo plano)"
              value={background}
              disabled={busy !== null}
              onChange={toggleBackground}
            />
            <Body>
              {background
                ? "Activo: verás una notificación fija mientras se comparte. Habilita avisos de llegada y salida de lugares."
                : "Apagado: solo se comparte mientras usas la app. No habrá avisos automáticos de lugares."}
            </Body>
          </>
        ) : (
          <Body>Apagado: nadie ve tu ubicación y no se guarda ninguna.</Body>
        )}
      </Card>

      <Card>
        <View style={styles.titleRow}><Bell color={colors.spruce} size={20} strokeWidth={2.3} /><CardTitle>Notificaciones</CardTitle></View>
        <Body>Recibe avisos de SOS, llegadas a lugares y mensajes aunque tengas la app cerrada.</Body>
        <Button label="Activar notificaciones" variant="secondary" onPress={() => void enablePush()} loading={busy === "push"} />
      </Card>

      <Card>
        <View style={styles.titleRow}><ShieldCheck color={colors.spruce} size={20} strokeWidth={2.3} /><CardTitle>Privacidad y datos</CardTitle></View>
        <Body>
          Solo las personas de tus círculos ven tu ubicación, y solo la de los círculos con los que la compartes. Guardamos tu historial de ubicación 30 días y el chat 90 días; después se borran solos.
        </Body>
        <Button label="Descargar mis datos" icon={Download} variant="secondary" onPress={() => void exportData()} loading={busy === "export"} />
        <Button label="Eliminar mi cuenta" icon={Trash2} variant="danger" onPress={confirmDelete} loading={busy === "delete"} />
      </Card>

      <Card>
        <View style={styles.titleRow}><Route color={colors.spruce} size={20} strokeWidth={2.3} /><CardTitle>Operación en campo</CardTitle></View>
        <Body>Accede al modo guía para preparar salidas, revisar asistencia y registrar eventos locales sin conexión.</Body>
        <Button label="Modo guía (offline)" onPress={() => router.push("/guia")} />
      </Card>
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggle}>
      <Text variant="bodyStrong" style={styles.toggleText}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: colors.spruce, false: colors.line }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: "row", alignItems: "center", gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleText: { flex: 1 },
});
