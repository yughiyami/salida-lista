import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Check, LocateFixed, Siren, Users } from "lucide-react-native";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import {
  keys,
  useActiveSos,
  useCircleRoster,
  useCircles,
  usePlaces,
  useUserSettings,
} from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import { describePause } from "../../features/location/pause";
import { currentPosition, ensureForegroundPermission } from "../../features/location/sharing";
import { formatBattery, formatLastSeen, isStale } from "../../domain/geo";
import { LiveMap, type MapMember } from "../../ui/LiveMap";
import { Avatar, Banner, Button, IconButton, Pill, Text, colors, radius, shadow } from "../../ui/kit";
import { useNow } from "../../ui/useNow";

export default function MapTabScreen() {
  const qc = useQueryClient();
  const me = useSession((s) => s.user?.id ?? "");
  const circles = useCircles();
  const settings = useUserSettings();
  const places = usePlaces();
  const sos = useActiveSos();
  const [circleId, setCircleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [busy, setBusy] = useState<"consent" | "checkin" | "sos" | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "danger"; text: string } | null>(null);

  const roster = useCircleRoster(circleId);
  const now = useNow();

  const members: MapMember[] = useMemo(() => {
    const seen = new Set<string>();
    const out: MapMember[] = [];
    for (const r of roster) {
      if (!r.location || seen.has(r.member.user_id)) continue;
      seen.add(r.member.user_id);
      const recorded = Date.parse(r.location.recorded_at);
      out.push({
        id: r.member.user_id,
        name: r.profile?.display_name ?? "Miembro",
        latitude: r.location.latitude,
        longitude: r.location.longitude,
        stale: isStale(recorded, now),
        sos: (sos.data ?? []).some((m) => m.user_id === r.member.user_id),
        isMe: r.member.user_id === me,
      });
    }
    return out;
  }, [roster, sos.data, me, now]);

  const consent = Boolean(settings.data?.location_consent_at);
  const pause = describePause(settings.data?.sharing_paused_until, now);
  const visiblePlaces = (places.data ?? []).filter((p) => !circleId || p.circle_id === circleId);
  const hasCircles = (circles.data?.length ?? 0) > 0;
  const activeSos = (sos.data ?? []).filter((m) => m.user_id !== me);
  const mySos = (sos.data ?? []).some((m) => m.user_id === me);

  const grantConsent = async () => {
    setBusy("consent");
    try {
      if (!(await ensureForegroundPermission())) {
        setNotice({ tone: "danger", text: "Sin permiso de ubicación no podemos compartirla. Actívalo en los ajustes del teléfono." });
        return;
      }
      await api.updateLocationSettings({ grantLocation: true });
      await qc.invalidateQueries({ queryKey: keys.settings });
      setNotice({ tone: "info", text: "Listo: tu círculo verá tu ubicación mientras uses la app." });
    } catch (e) {
      setNotice({ tone: "danger", text: mapCircleError(e) });
    } finally {
      setBusy(null);
    }
  };

  const checkin = async () => {
    setBusy("checkin");
    try {
      const position = await currentPosition();
      const count = await api.sendCheckin(circleId, position);
      setNotice({ tone: "info", text: `Avisaste que llegaste bien a ${count} círculo${count === 1 ? "" : "s"}.` });
    } catch (e) {
      setNotice({ tone: "danger", text: mapCircleError(e) });
    } finally {
      setBusy(null);
    }
  };

  const triggerSos = () => {
    Alert.alert(
      "Enviar SOS",
      "Se avisará ahora a todos tus círculos con tu ubicación, aunque tengas la ubicación en pausa.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar SOS",
          style: "destructive",
          onPress: async () => {
            setBusy("sos");
            try {
              const position = await currentPosition();
              await api.sendSos(position);
              await qc.invalidateQueries({ queryKey: keys.sos });
              setNotice({ tone: "danger", text: "SOS enviado a tus círculos." });
            } catch (e) {
              setNotice({ tone: "danger", text: mapCircleError(e) });
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const resolveMine = async () => {
    try {
      await api.resolveSos(null);
      await qc.invalidateQueries({ queryKey: keys.sos });
      setNotice({ tone: "info", text: "Marcaste tu SOS como resuelto." });
    } catch (e) {
      setNotice({ tone: "danger", text: mapCircleError(e) });
    }
  };

  if (circles.isSuccess && !hasCircles) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Users color={colors.spruceDeep} size={34} strokeWidth={2} />
          </View>
          <Text variant="title" style={{ textAlign: "center" }}>
            Tu gente aparecerá aquí
          </Text>
          <Text variant="body" style={{ textAlign: "center" }}>
            Crea un círculo o únete con un código para ver a tu familia y amigos en el mapa.
          </Text>
          <Link href="/(tabs)/circulos" asChild>
            <Pressable accessibilityRole="button" style={styles.emptyButton}>
              <Text variant="button">Ir a Círculos</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const refit = (id: string | null) => {
    setCircleId(id);
    setSelected(null);
    setFocusKey((k) => k + 1);
  };

  return (
    <View style={styles.safe}>
      <LiveMap
        members={members}
        places={visiblePlaces}
        selectedId={selected}
        onSelectMember={(id) => setSelected((cur) => (cur === id ? null : id))}
        focusKey={`${focusKey}-${members.length}`}
      />

      <SafeAreaView style={styles.top} edges={["top"]} pointerEvents="box-none">
        <View style={styles.chipsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Todos" active={circleId === null} onPress={() => refit(null)} />
            {(circles.data ?? []).map((c) => (
              <Chip key={c.id} label={c.name} active={circleId === c.id} onPress={() => refit(c.id)} />
            ))}
          </ScrollView>
        </View>
        <View style={styles.statusRow} pointerEvents="box-none">
          {consent ? (
            <Pill tone={pause.paused ? "warn" : "live"}>{pause.paused ? pause.label : "Compartiendo ubicación"}</Pill>
          ) : null}
        </View>
        <View style={styles.banners} pointerEvents="box-none">
          {activeSos.map((m) => (
            <Banner key={m.id} tone="danger">
              {m.body}
            </Banner>
          ))}
          {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}
        </View>
      </SafeAreaView>

      <View style={styles.fab} pointerEvents="box-none">
        <IconButton icon={LocateFixed} label="Centrar el mapa" onPress={() => { setSelected(null); setFocusKey((k) => k + 1); }} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        {!consent && settings.isSuccess ? (
          <View style={{ gap: 10 }}>
            <Text variant="heading">Comparte tu ubicación con tu círculo</Text>
            <Text variant="body">Solo las personas de tus círculos la ven. Puedes pausarla o retirarla cuando quieras en Ajustes.</Text>
            <Button label="Activar compartir ubicación" onPress={() => void grantConsent()} loading={busy === "consent"} />
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people}>
              {roster.map((r) => {
                const name = r.profile?.display_name ?? "Miembro";
                const rec = r.location ? Date.parse(r.location.recorded_at) : null;
                const isSos = (sos.data ?? []).some((m) => m.user_id === r.member.user_id);
                const status = isSos ? "sos" : rec ? (isStale(rec, now) ? "stale" : "live") : "none";
                return (
                  <Pressable
                    key={`${r.member.circle_id}-${r.member.user_id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver a ${name}`}
                    onPress={() => r.location && setSelected(r.member.user_id)}
                    style={[styles.person, selected === r.member.user_id && styles.personSelected]}
                  >
                    <Avatar name={name} id={r.member.user_id} size={46} status={status} />
                    <View style={{ maxWidth: 130 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {r.member.user_id === me ? "Yo" : name}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {rec ? `${formatLastSeen(rec, now)} · ${formatBattery(r.location?.battery_level, r.location?.is_charging)}` : "Sin ubicación"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Llegué bien" icon={Check} onPress={() => void checkin()} loading={busy === "checkin"} disabled={!hasCircles} />
              </View>
              <View style={{ flex: 0.8 }}>
                {mySos ? (
                  <Button label="Resolver SOS" variant="ghost" onPress={() => void resolveMine()} />
                ) : (
                  <Button label="SOS" icon={Siren} variant="danger" onPress={triggerSos} loading={busy === "sos"} disabled={!hasCircles} accessibilityLabel="Enviar SOS a mis círculos" />
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text variant="bodyStrong" style={{ color: active ? colors.white : colors.ink, fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  top: { position: "absolute", top: 0, left: 0, right: 0, gap: 8 },
  chipsWrap: { marginTop: 8 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    justifyContent: "center",
    ...shadow.card,
  },
  chipActive: { backgroundColor: colors.spruceDeep },
  statusRow: { paddingHorizontal: 16, alignItems: "flex-start" },
  banners: { paddingHorizontal: 16, gap: 8 },
  fab: { position: "absolute", right: 16, bottom: 236 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 14,
    ...shadow.float,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  people: { gap: 10, paddingRight: 8 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.ground,
    minHeight: 64,
  },
  personSelected: { backgroundColor: colors.spruceTint },
  actions: { flexDirection: "row", gap: 10 },
  empty: { flex: 1, padding: 32, gap: 14, alignItems: "center", justifyContent: "center" },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
  emptyButton: { minHeight: 54, alignSelf: "stretch", borderRadius: radius.md, backgroundColor: colors.spruce, alignItems: "center", justifyContent: "center" },
});
