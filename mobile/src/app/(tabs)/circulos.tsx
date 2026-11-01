import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useCircleMutations,
  useCircles,
  useMembers,
} from "../../features/circles/hooks";
import {
  formatInviteCode,
  mapCircleError,
  validateCircleName,
  validateInviteCode,
} from "../../features/circles/validation";
import { Banner, Body, Button, Card, CardTitle, Field, Screen, colors } from "../../ui/kit";

export default function CirclesTabScreen() {
  const router = useRouter();
  const circles = useCircles();
  const members = useMembers();
  const { create, join } = useCircleMutations();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const countFor = (id: string) =>
    (members.data ?? []).filter((m) => m.circle_id === id).length;

  const submitCreate = () => {
    const parsed = validateCircleName(name);
    if (!parsed.ok) return setNameError(parsed.error);
    setNameError(null);
    setMessage(null);
    create.mutate(parsed.value, {
      onSuccess: (circle) => {
        setName("");
        router.push({ pathname: "/circulo/[id]", params: { id: circle.id } });
      },
      onError: (e) => setNameError(mapCircleError(e)),
    });
  };

  const submitJoin = () => {
    const parsed = validateInviteCode(code);
    if (!parsed.ok) return setCodeError(parsed.error);
    setCodeError(null);
    setMessage(null);
    join.mutate(parsed.value, {
      onSuccess: (circle) => {
        setCode("");
        setMessage(`Te uniste a «${circle.name}».`);
        router.push({ pathname: "/circulo/[id]", params: { id: circle.id } });
      },
      onError: (e) => setCodeError(mapCircleError(e)),
    });
  };

  return (
    <Screen title="Círculos">
      {circles.isError ? <Banner tone="danger">No pudimos cargar tus círculos. Revisa tu conexión.</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}

      {(circles.data ?? []).map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir círculo ${c.name}`}
          onPress={() => router.push({ pathname: "/circulo/[id]", params: { id: c.id } })}
          style={({ pressed }) => [styles.circle, pressed && { opacity: 0.8 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.circleName}>{c.name}</Text>
            <Text style={styles.circleMeta}>
              {countFor(c.id)} {countFor(c.id) === 1 ? "persona" : "personas"} · código {formatInviteCode(c.invite_code)}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}

      {circles.isSuccess && circles.data.length === 0 ? (
        <Card>
          <Body>Todavía no tienes círculos. Crea uno para tu familia o amigos, o únete con el código que te compartieron.</Body>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Crear un círculo</CardTitle>
        <Field label="Nombre del círculo" value={name} onChangeText={setName} placeholder="Familia, Amigos…" maxLength={40} error={nameError} />
        <Button label="Crear círculo" onPress={submitCreate} loading={create.isPending} />
      </Card>

      <Card>
        <CardTitle>Unirme con un código</CardTitle>
        <Field
          label="Código de invitación"
          value={code}
          onChangeText={setCode}
          placeholder="ABCD-EFGH"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          error={codeError}
        />
        <Button label="Unirme" variant="secondary" onPress={submitJoin} loading={join.isPending} />
      </Card>
      <Body>Solo las personas de tus círculos ven tu ubicación. Puedes dejar de compartir con un círculo cuando quieras.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    minHeight: 72,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleName: { fontSize: 18, fontWeight: "700", color: colors.ink },
  circleMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 28, color: colors.muted },
});
