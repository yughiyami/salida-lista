import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import { keys, useCircles, usePlaces } from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import { MapPin, Plus, Trash2 } from "lucide-react-native";
import { Banner, Body, Button, Card, CardTitle, Pill, Screen, Text, colors } from "../../ui/kit";

export default function PlacesTabScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useSession((s) => s.user?.id ?? "");
  const circles = useCircles();
  const places = usePlaces();
  const [error, setError] = useState<string | null>(null);

  const circleName = (id: string) => (circles.data ?? []).find((c) => c.id === id)?.name ?? "Círculo";

  const confirmDelete = (id: string, name: string) =>
    Alert.alert("Eliminar lugar", `¿Eliminar «${name}»? Dejarás de recibir avisos de llegada y salida.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deletePlace(id);
            await qc.invalidateQueries({ queryKey: keys.places });
          } catch (e) {
            setError(mapCircleError(e));
          }
        },
      },
    ]);

  const hasCircles = (circles.data?.length ?? 0) > 0;

  return (
    <Screen title="Lugares" subtitle="Casa, colegio, trabajo: tu círculo sabe cuándo llegas o sales.">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {hasCircles ? (
        <Button label="Agregar lugar" icon={Plus} onPress={() => router.push("/lugar/nuevo")} />
      ) : (
        <Banner tone="warn">Primero crea o únete a un círculo para poder agregar lugares.</Banner>
      )}

      {(places.data ?? []).map((p) => (
        <Card key={p.id}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.spruceTint, alignItems: "center", justifyContent: "center" }}>
              <MapPin color={colors.spruce} size={22} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <CardTitle>{p.name}</CardTitle>
              <Text variant="small">{circleName(p.circle_id)}</Text>
            </View>
            <Pill>{p.radius_m} m</Pill>
          </View>
          {p.created_by === me || (circles.data ?? []).some((c) => c.id === p.circle_id && c.owner_id === me) ? (
            <Button label="Eliminar" icon={Trash2} variant="ghost" onPress={() => confirmDelete(p.id, p.name)} accessibilityLabel={`Eliminar ${p.name}`} />
          ) : null}
        </Card>
      ))}

      {places.isSuccess && places.data.length === 0 && hasCircles ? <Body>Aún no hay lugares.</Body> : null}
      <Body>
        Los avisos automáticos de llegada y salida funcionan con la ubicación en segundo plano activada en Ajustes.
      </Body>
    </Screen>
  );
}
