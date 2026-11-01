import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../features/auth/useSession";
import * as api from "../../features/circles/api";
import {
  keys,
  useCircleRoster,
  useCircles,
  useMessages,
} from "../../features/circles/hooks";
import { mapCircleError } from "../../features/circles/validation";
import type { FeedMessage } from "../../features/circles/types";
import { Banner, colors } from "../../ui/kit";

const KIND_STYLE: Record<FeedMessage["kind"], { bg: string; fg: string } | null> = {
  text: null,
  checkin: { bg: "#E1F1E4", fg: "#1D5A32" },
  place: { bg: "#E4EAD9", fg: "#163F35" },
  sos: { bg: "#FBE9E7", fg: "#B3261E" },
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {circle?.name ?? "Chat"}
        </Text>
      </View>
      {error ? <View style={{ paddingHorizontal: 16 }}><Banner tone="danger">{error}</Banner></View> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={list}
          data={messages.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {messages.isLoading ? "Cargando…" : "Aún no hay mensajes. Escribe el primero."}
            </Text>
          }
          renderItem={({ item }) => {
            const special = KIND_STYLE[item.kind];
            const mine = item.user_id === me;
            if (special) {
              return (
                <View style={[styles.event, { backgroundColor: special.bg }]}>
                  <Text style={{ color: special.fg, fontWeight: "600" }}>{item.body}</Text>
                  <Text style={[styles.time, { color: special.fg }]}>{formatTime(item.created_at)}</Text>
                </View>
              );
            }
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                {!mine ? <Text style={styles.author}>{nameOf(item.user_id)}</Text> : null}
                <Text style={[styles.text, mine && { color: "#FFFFFF" }]}>{item.body}</Text>
                <Text style={[styles.time, mine && { color: "#CFE3D8" }]}>{formatTime(item.created_at)}</Text>
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
            placeholderTextColor="#8A938C"
            maxLength={500}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            disabled={sending || !draft.trim()}
            onPress={() => void send()}
            style={[styles.send, (sending || !draft.trim()) && { opacity: 0.5 }]}
          >
            <Text style={styles.sendText}>Enviar</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingVertical: 8 },
  back: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 36, color: colors.ink, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  bubble: { maxWidth: "82%", padding: 12, borderRadius: 16, gap: 2 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.ink },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  author: { fontSize: 12, fontWeight: "700", color: colors.ink },
  text: { fontSize: 15, color: colors.ink },
  time: { fontSize: 11, color: colors.muted, alignSelf: "flex-end" },
  event: { padding: 12, borderRadius: 12, gap: 2 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.ink },
  send: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "700" },
});
