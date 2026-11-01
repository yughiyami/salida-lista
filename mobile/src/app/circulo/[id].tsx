import { useState } from "react";
import { Alert, Share, StyleSheet, Switch, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "../../features/auth/useSession";
import {
  useCircleMutations,
  useCircleRoster,
  useCircles,
} from "../../features/circles/hooks";
import { formatInviteCode, mapCircleError } from "../../features/circles/validation";
import { formatBattery, formatLastSeen } from "../../domain/geo";
import { Avatar, Banner, Body, Button, Card, CardTitle, Screen, colors } from "../../ui/kit";
import { useNow } from "../../ui/useNow";

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const me = useSession((s) => s.user?.id ?? "");
  const circles = useCircles();
  const roster = useCircleRoster(id);
  const { leave, rotate, remove, setSharing } = useCircleMutations();
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  const circle = (circles.data ?? []).find((c) => c.id === id);
  if (!circle) {
    return (
      <Screen title="Círculo">
        <Banner tone="warn">{circles.isLoading ? "Cargando…" : "Este círculo ya no está disponible."}</Banner>
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const isOwner = circle.owner_id === me;
  const mine = roster.find((r) => r.member.user_id === me);
  const fail = (e: unknown) => setError(mapCircleError(e));

  const shareCode = () =>
    void Share.share({
      message: `Únete a mi círculo «${circle.name}» en Salida Lista con el código ${formatInviteCode(circle.invite_code)}.`,
    });

  const confirmLeave = () =>
    Alert.alert(
      "Salir del círculo",
      isOwner
        ? "Eres quien lo creó: el círculo pasará a la persona que lleva más tiempo en él, o se eliminará si estás solo."
        : "Dejarás de ver a este círculo y ellos dejarán de verte.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => leave.mutate(circle.id, { onSuccess: () => router.replace("/(tabs)/circulos"), onError: fail }),
        },
      ],
    );

  const confirmRemove = (userId: string, name: string) =>
    Alert.alert("Quitar del círculo", `¿Quitar a ${name}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Quitar", style: "destructive", onPress: () => remove.mutate({ circleId: circle.id, userId }, { onError: fail }) },
    ]);

  const confirmRotate = () =>
    Alert.alert("Cambiar código", "El código anterior dejará de funcionar. Quienes ya están dentro no se ven afectados.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cambiar", onPress: () => rotate.mutate(circle.id, { onError: fail }) },
    ]);

  return (
    <Screen title={circle.name} edges={["top", "bottom"]}>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Card>
        <CardTitle>Código de invitación</CardTitle>
        <Text selectable style={styles.code}>{formatInviteCode(circle.invite_code)}</Text>
        <Body>Compártelo solo con gente de confianza: quien lo tenga puede unirse y ver la ubicación de los miembros que comparten.</Body>
        <Button label="Compartir código" onPress={shareCode} />
        {isOwner ? <Button label="Generar código nuevo" variant="ghost" onPress={confirmRotate} loading={rotate.isPending} /> : null}
      </Card>

      <Card>
        <CardTitle>Mi ubicación en este círculo</CardTitle>
        <View style={styles.row}>
          <Text style={[styles.rowText, { flex: 1 }]}>Compartir mi ubicación con este círculo</Text>
          <Switch
            accessibilityLabel="Compartir mi ubicación con este círculo"
            value={mine?.member.share_location ?? true}
            onValueChange={(share) => setSharing.mutate({ circleId: circle.id, share }, { onError: fail })}
            trackColor={{ true: colors.ink, false: colors.border }}
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Miembros ({roster.length})</CardTitle>
        {roster.map((r) => {
          const name = r.profile?.display_name ?? "Miembro";
          const rec = r.location ? Date.parse(r.location.recorded_at) : null;
          return (
            <View key={r.member.user_id} style={styles.row}>
              <Avatar name={name} id={r.member.user_id} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>
                  {name}{r.member.user_id === me ? " (yo)" : ""}{r.member.role === "owner" ? " · creó el círculo" : ""}
                </Text>
                <Text style={styles.meta}>
                  {!r.member.share_location
                    ? "No comparte ubicación"
                    : rec
                      ? `${formatLastSeen(rec, now)} · ${formatBattery(r.location?.battery_level, r.location?.is_charging)}`
                      : "Sin ubicación todavía"}
                </Text>
              </View>
              {isOwner && r.member.user_id !== me ? (
                <Button label="Quitar" variant="ghost" onPress={() => confirmRemove(r.member.user_id, name)} accessibilityLabel={`Quitar a ${name}`} />
              ) : null}
            </View>
          );
        })}
      </Card>

      <Button label="Abrir chat del círculo" onPress={() => router.push({ pathname: "/chat/[id]", params: { id: circle.id } })} />
      <Button label="Salir del círculo" variant="danger" onPress={confirmLeave} loading={leave.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 34, fontWeight: "800", letterSpacing: 4, color: colors.ink, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 15, fontWeight: "600", color: colors.ink },
  meta: { fontSize: 12, color: colors.muted },
});
