import { useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Switch, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, LogOut, MessageCircle, Share2 } from "lucide-react-native";
import { useSession } from "../../features/auth/useSession";
import { useCircleMutations, useCircleRoster, useCircles } from "../../features/circles/hooks";
import { formatInviteCode, mapCircleError } from "../../features/circles/validation";
import { formatBattery, formatLastSeen, isStale } from "../../domain/geo";
import { Avatar, Banner, Button, Card, CardTitle, Pill, Screen, Text, colors, radius } from "../../ui/kit";
import { Topo } from "../../ui/Topo";
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
    <Screen edges={["top", "bottom"]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.ink} size={26} />
        <Text variant="bodyStrong">Círculos</Text>
      </Pressable>
      <Text accessibilityRole="header" variant="display" style={{ marginTop: -4 }}>
        {circle.name}
      </Text>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <View style={styles.codeCard}>
        <Topo color={colors.lime} opacity={0.2} rings={9} seed={4} />
        <Text variant="caption" style={{ color: colors.lime }}>
          Código de invitación
        </Text>
        <Text selectable style={styles.code}>
          {formatInviteCode(circle.invite_code)}
        </Text>
        <Text variant="small" style={{ color: "#B7D3C6" }}>
          Compártelo solo con gente de confianza: quien lo tenga puede unirse y ver la ubicación de quienes comparten.
        </Text>
        <Button label="Compartir código" icon={Share2} variant="lime" onPress={shareCode} />
        {isOwner ? (
          <Pressable accessibilityRole="button" onPress={confirmRotate} style={styles.rotate}>
            <Text variant="bodyStrong" style={{ color: colors.lime }}>
              {rotate.isPending ? "Generando…" : "Generar código nuevo"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <CardTitle>Compartir mi ubicación</CardTitle>
            <Text variant="small">Con este círculo</Text>
          </View>
          <Switch
            accessibilityLabel="Compartir mi ubicación con este círculo"
            value={mine?.member.share_location ?? true}
            onValueChange={(share) => setSharing.mutate({ circleId: circle.id, share }, { onError: fail })}
            trackColor={{ true: colors.spruce, false: colors.line }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Miembros · {roster.length}</CardTitle>
        {roster.map((r) => {
          const name = r.profile?.display_name ?? "Miembro";
          const rec = r.location ? Date.parse(r.location.recorded_at) : null;
          const status = !r.member.share_location || !rec ? "none" : isStale(rec, now) ? "stale" : "live";
          return (
            <View key={r.member.user_id} style={styles.row}>
              <Avatar name={name} id={r.member.user_id} status={status} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">
                  {name}
                  {r.member.user_id === me ? " (yo)" : ""}
                </Text>
                <Text variant="small">
                  {!r.member.share_location
                    ? "No comparte ubicación"
                    : rec
                      ? `${formatLastSeen(rec, now)} · ${formatBattery(r.location?.battery_level, r.location?.is_charging)}`
                      : "Sin ubicación todavía"}
                </Text>
              </View>
              {r.member.role === "owner" ? <Pill>Creó el círculo</Pill> : null}
              {isOwner && r.member.user_id !== me ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Quitar a ${name}`} onPress={() => confirmRemove(r.member.user_id, name)} style={styles.remove}>
                  <Text variant="caption" style={{ color: colors.danger }}>
                    Quitar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Button label="Abrir chat del círculo" icon={MessageCircle} onPress={() => router.push({ pathname: "/chat/[id]", params: { id: circle.id } })} />
      <Button label="Salir del círculo" icon={LogOut} variant="ghost" onPress={confirmLeave} loading={leave.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", minHeight: 48, marginLeft: -6 },
  codeCard: {
    overflow: "hidden",
    backgroundColor: colors.spruceDeep,
    borderRadius: radius.xl,
    padding: 22,
    gap: 10,
  },
  code: { fontFamily: "Figtree_800ExtraBold", fontSize: 40, letterSpacing: 5, color: colors.white },
  rotate: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  remove: { minHeight: 40, minWidth: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
});
