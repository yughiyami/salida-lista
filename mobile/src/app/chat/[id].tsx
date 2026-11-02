import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, MapPin, Send, Siren, type LucideIcon } from "lucide-react-native";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import { keys, useCircleRoster, useCircles, useMessages } from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import type { FeedMessage } from "../../features/circles/types";
import { Banner, Text, colors, fonts, radius } from "../../ui/kit";

const EVENT: Record<Exclude<FeedMessage["kind"], "text">, { bg: string; fg: string; Icon: LucideIcon }> = {
  checkin: { bg: "#D6F3E4", fg: "#0B6B45", Icon: Check },
  place: { bg: colors.spruceTint, fg: colors.spruceDeep, Icon: MapPin },
  sos: { bg: colors.dangerSoft, fg: colors.danger, Icon: Siren },
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useSession((s) => s.user?.id ?? "");
  const circles = useCircles();
  const roster = useCircleRoster(id);
  const messages = useMessages(id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<FeedMessage>>(null);

  const circle = (circles.data ?? []).find((c) => c.id === id);
  const nameOf = (userId: string) =>
    userId === me ? "Yo" : (roster.find((r) => r.member.user_id === userId)?.profile?.display_name ?? "Miembro");

  useEffect(() => {
    if ((messages.data?.length ?? 0) > 0) {
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.data?.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.sendText(id, me, body);
      setDraft("");
      await qc.invalidateQueries({ queryKey: keys.messages(id) });
    } catch (e) {
      setError(mapCircleError(e));
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && draft.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color={colors.ink} size={28} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" variant="title" numberOfLines={1}>
            {circle?.name ?? "Chat"}
          </Text>
          <Text variant="small">{roster.length} {roster.length === 1 ? "persona" : "personas"}</Text>
        </View>
      </View>
      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={list}
          data={messages.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="body" style={{ textAlign: "center", marginTop: 48 }}>
              {messages.isLoading ? "Cargando…" : "Aún no hay mensajes. Escribe el primero."}
            </Text>
          }
          renderItem={({ item }) => {
            if (item.kind !== "text") {
              const e = EVENT[item.kind];
              return (
                <View style={[styles.event, { backgroundColor: e.bg }]}>
                  <e.Icon color={e.fg} size={18} strokeWidth={2.4} />
                  <Text variant="bodyStrong" style={{ color: e.fg, flex: 1 }}>
                    {item.body}
                  </Text>
                  <Text variant="caption" style={{ color: e.fg }}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              );
            }
            const mine = item.user_id === me;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                {!mine ? (
                  <Text variant="caption" style={{ color: colors.spruce }}>
                    {nameOf(item.user_id)}
                  </Text>
                ) : null}
                <Text variant="body" style={{ color: mine ? colors.white : colors.ink }}>
                  {item.body}
                </Text>
                <Text variant="caption" style={{ color: mine ? "#B7D3C6" : colors.inkSoft, alignSelf: "flex-end" }}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Mensaje"
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor="#7C8A82"
            maxLength={500}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            disabled={!canSend}
            onPress={() => void send()}
            style={[styles.send, !canSend && { opacity: 0.4 }]}
          >
            <Send color={colors.white} size={20} strokeWidth={2.3} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  header: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 8 },
  back: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: { maxWidth: "82%", paddingVertical: 10, paddingHorizontal: 14, gap: 2 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.spruce, borderRadius: radius.lg, borderBottomRightRadius: 6 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: radius.lg, borderBottomLeftRadius: 6 },
  event: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, backgroundColor: colors.white },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 13,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.ground,
  },
  send: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.spruce, alignItems: "center", justifyContent: "center" },
});
