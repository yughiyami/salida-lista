import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import { keys, useCircles } from "../../features/circles/hooks";
import { mapCircleError, validatePlaceName } from "../../features/circles/validation";
import { currentPosition } from "../../features/location/sharing";
import type { LatLng } from "../../domain/geo";
import { LiveMap } from "../../ui/LiveMap";
import { Banner, Body, Button, Field, Screen, colors } from "../../ui/kit";

const RADII = [100, 150, 300, 500];

export default function NewPlaceScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useSession((s) => s.user?.id ?? "");
  const circles = useCircles();
  const [circleId, setCircleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(150);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [start, setStart] = useState<LatLng | undefined>(undefined);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void currentPosition().then((p) => {
      if (p) {
        setStart(p);
        setPin((cur) => cur ?? p);
      }
    });
  }, []);

  const selectedCircle = circleId ?? circles.data?.[0]?.id ?? null;

  const save = async () => {
    const parsed = validatePlaceName(name);
    if (!parsed.ok) return setNameError(parsed.error);
    setNameError(null);
    if (!selectedCircle) return setError("Elige un círculo.");
    if (!pin) return setError("Toca el mapa para elegir dónde está el lugar.");
    setSaving(true);
    setError(null);
    try {
      await api.createPlace({
        circle_id: selectedCircle,
        name: parsed.value,
        latitude: pin.latitude,
        longitude: pin.longitude,
        radius_m: radius,
        created_by: me,
      });
      await qc.invalidateQueries({ queryKey: keys.places });
      router.back();
    } catch (e) {
      setError(mapCircleError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Nuevo lugar" edges={["top", "bottom"]}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field label="Nombre del lugar" value={name} onChangeText={setName} placeholder="Casa, Colegio…" maxLength={40} error={nameError} />

      <Text style={styles.label}>Círculo que recibe los avisos</Text>
      <View style={styles.chips}>
        {(circles.data ?? []).map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCircle === c.id }}
            onPress={() => setCircleId(c.id)}
            style={[styles.chip, selectedCircle === c.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, selectedCircle === c.id && { color: "#FFFFFF" }]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Radio</Text>
      <View style={styles.chips}>
        {RADII.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="button"
            accessibilityState={{ selected: radius === r }}
            onPress={() => setRadius(r)}
            style={[styles.chip, radius === r && styles.chipOn]}
          >
            <Text style={[styles.chipText, radius === r && { color: "#FFFFFF" }]}>{r} m</Text>
          </Pressable>
        ))}
      </View>

      <Body>Toca el mapa para mover el punto. El círculo verde es la zona que dispara el aviso.</Body>
      <View style={styles.map}>
        <LiveMap members={[]} pin={pin} pinRadius={radius} initialCenter={start} focusKey={pin ? `${pin.latitude}` : "none"} onPressMap={setPin} />
      </View>
      <Button label="Usar mi ubicación actual" variant="secondary" onPress={() => void currentPosition().then((p) => p && setPin(p))} />
      <Button label="Guardar lugar" onPress={() => void save()} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.soft, justifyContent: "center" },
  chipOn: { backgroundColor: colors.ink },
  chipText: { color: colors.ink, fontWeight: "600" },
  map: { height: 300, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
});
