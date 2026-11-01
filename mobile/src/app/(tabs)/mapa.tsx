import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  currentPosition,
  ensureForegroundPermission,
} from "../../features/location/sharing";
import { formatBattery, formatLastSeen, isStale } from "../../domain/geo";
import { LiveMap, type MapMember } from "../../ui/LiveMap";
import { Avatar, Banner, Button, colors } from "../../ui/kit";
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

  const mySos = (sos.data ?? []).some((m) => m.user_id === me);

  if (circles.isSuccess && !hasCircles) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={styles.title}>Mapa</Text>
          <Banner>Aún no estás en ningún círculo. Crea uno o únete con un código para ver a tu gente en el mapa.</Banner>
          <Link href="/(tabs)/circulos" asChild>
            <Pressable accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkText}>Ir a Círculos</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Todos" active={circleId === null} onPress={() => { setCircleId(null); setSelected(null); setFocusKey((k) => k + 1); }} />
          {(circles.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} active={circleId === c.id} onPress={() => { setCircleId(c.id); setSelected(null); setFocusKey((k) => k + 1); }} />
          ))}
        </ScrollView>
      </View>

      {!consent && settings.isSuccess ? (
        <View style={styles.banners}>
          <Banner tone="warn">Para que tu círculo te vea, activa el uso compartido de tu ubicación. Puedes pausarlo o retirarlo cuando quieras.</Banner>
          <Button label="Activar compartir ubicación" onPress={() => void grantConsent()} loading={busy === "consent"} />
        </View>
      ) : null}
      {pause.paused ? <View style={styles.banners}><Banner tone="warn">{pause.label}. Nadie ve tu ubicación hasta que la reanudes en Ajustes.</Banner></View> : null}
      {activeSos.map((m) => (
        <View key={m.id} style={styles.banners}>
          <Banner tone="danger">{m.body}</Banner>
        </View>
      ))}
      {notice ? <View style={styles.banners}><Banner tone={notice.tone}>{notice.text}</Banner></View> : null}

      <LiveMap
        members={members}
        places={visiblePlaces}
        selectedId={selected}
        onSelectMember={(id) => setSelected((cur) => (cur === id ? null : id))}
        focusKey={focusKey}
      />

      <View style={styles.sheet}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people}>
          {roster.map((r) => {
            const name = r.profile?.display_name ?? "Miembro";
            const rec = r.location ? Date.parse(r.location.recorded_at) : null;
            return (
              <Pressable
                key={`${r.member.circle_id}-${r.member.user_id}`}
                accessibilityRole="button"
                accessibilityLabel={`Ver a ${name}`}
                onPress={() => r.location && setSelected(r.member.user_id)}
                style={[styles.person, selected === r.member.user_id && styles.personSelected]}
              >
                <Avatar name={name} id={r.member.user_id} size={36} />
                <View>
                  <Text style={styles.personName}>{r.member.user_id === me ? "Yo" : name}</Text>
                  <Text style={styles.personMeta}>
                    {rec ? `${formatLastSeen(rec, now)} · ${formatBattery(r.location?.battery_level, r.location?.is_charging)}` : "Sin ubicación"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Llegué bien" variant="secondary" onPress={() => void checkin()} loading={busy === "checkin"} disabled={!hasCircles} />
          </View>
          <View style={{ flex: 1 }}>
            {mySos ? (
              <Button label="Resolver SOS" variant="ghost" onPress={() => void resolveMine()} />
            ) : (
              <Button label="SOS" variant="danger" onPress={triggerSos} loading={busy === "sos"} disabled={!hasCircles} accessibilityLabel="Enviar SOS a mis círculos" />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
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
      <Text style={[styles.chipText, active && { color: "#FFFFFF" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, padding: 24, gap: 14 },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink, letterSpacing: -0.8 },
  link: { minHeight: 52, borderRadius: 14, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  linkText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  header: { paddingVertical: 8 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.soft, justifyContent: "center" },
  chipActive: { backgroundColor: colors.ink },
  chipText: { color: colors.ink, fontWeight: "600" },
  banners: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  sheet: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: 14, gap: 12 },
  people: { gap: 10 },
  person: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, minHeight: 56 },
  personSelected: { borderColor: colors.ink, backgroundColor: colors.soft },
  personName: { fontWeight: "700", color: colors.ink },
  personMeta: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: "row", gap: 10 },
});
