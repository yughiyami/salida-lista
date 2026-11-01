import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import { keys, useCircles, usePlaces } from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import { Banner, Body, Button, Card, CardTitle, Screen, colors } from "../../ui/kit";

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
    <Screen title="Lugares">
      <Body>Marca casa, el colegio o el trabajo. Tu círculo recibe un aviso cuando alguien llega o sale.</Body>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {hasCircles ? (
        <Button label="Agregar lugar" onPress={() => router.push("/lugar/nuevo")} />
      ) : (
        <Banner tone="warn">Primero crea o únete a un círculo para poder agregar lugares.</Banner>
      )}

      {(places.data ?? []).map((p) => (
        <Card key={p.id}>
          <CardTitle>{p.name}</CardTitle>
          <Text style={{ color: colors.muted }}>
            {circleName(p.circle_id)} · radio {p.radius_m} m
          </Text>
          {p.created_by === me || (circles.data ?? []).some((c) => c.id === p.circle_id && c.owner_id === me) ? (
            <View>
              <Button label="Eliminar" variant="ghost" onPress={() => confirmDelete(p.id, p.name)} accessibilityLabel={`Eliminar ${p.name}`} />
            </View>
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
