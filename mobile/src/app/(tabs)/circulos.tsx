import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, KeyRound, Plus } from "lucide-react-native";
import {
  useCircleMutations,
  useCircles,
  useMembers,
  useProfilesById,
} from "../../features/circles/hooks";
import {
  formatInviteCode,
  mapCircleError,
  validateCircleName,
  validateInviteCode,
} from "../../features/circles/validation";
import { Avatar, Banner, Button, Card, Field, Pill, Screen, Segmented, Text, colors, radius, shadow } from "../../ui/kit";

export default function CirclesTabScreen() {
  const router = useRouter();
  const circles = useCircles();
  const members = useMembers();
  const profiles = useProfilesById();
  const { create, join } = useCircleMutations();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const membersOf = (id: string) => (members.data ?? []).filter((m) => m.circle_id === id);

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
    <Screen title="Círculos" subtitle="Tu gente de confianza, a un toque.">
      {circles.isError ? <Banner tone="danger">No pudimos cargar tus círculos. Revisa tu conexión.</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}

      {(circles.data ?? []).map((c) => {
        const list = membersOf(c.id);
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir círculo ${c.name}`}
            onPress={() => router.push({ pathname: "/circulo/[id]", params: { id: c.id } })}
            style={({ pressed }) => [styles.circle, pressed && { transform: [{ scale: 0.985 }] }]}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <Text variant="title" numberOfLines={1}>
                {c.name}
              </Text>
              <View style={styles.stack}>
                {list.slice(0, 4).map((m, i) => (
                  <View key={m.user_id} style={[styles.stackItem, i > 0 && { marginLeft: -12 }]}>
                    <Avatar name={profiles.get(m.user_id)?.display_name ?? "Miembro"} id={m.user_id} size={34} />
                  </View>
                ))}
                <Text variant="small" style={{ marginLeft: 10 }}>
                  {list.length} {list.length === 1 ? "persona" : "personas"}
                </Text>
              </View>
              <Pill icon={KeyRound}>{formatInviteCode(c.invite_code)}</Pill>
            </View>
            <ChevronRight color={colors.inkSoft} size={26} />
          </Pressable>
        );
      })}

      {circles.isSuccess && circles.data.length === 0 ? (
        <Card>
          <Text variant="heading">Aún no tienes círculos</Text>
          <Text variant="body">Crea uno para tu familia o amigos, o únete con el código que te compartieron.</Text>
        </Card>
      ) : null}

      <Card>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "create", label: "Crear círculo" },
            { value: "join", label: "Tengo un código" },
          ]}
        />
        {mode === "create" ? (
          <>
            <Field label="Nombre del círculo" value={name} onChangeText={setName} placeholder="Familia, Amigos…" maxLength={40} error={nameError} />
            <Button label="Crear círculo" icon={Plus} onPress={submitCreate} loading={create.isPending} />
          </>
        ) : (
          <>
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
            <Button label="Unirme" icon={KeyRound} onPress={submitJoin} loading={join.isPending} />
          </>
        )}
      </Card>
      <Text variant="small" style={{ textAlign: "center" }}>
        Solo las personas de tus círculos ven tu ubicación. Puedes dejar de compartir con un círculo cuando quieras.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  stack: { flexDirection: "row", alignItems: "center" },
  stackItem: { borderRadius: 20, borderWidth: 2, borderColor: colors.white },
});
