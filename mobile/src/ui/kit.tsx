import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { initials } from "../domain/geo";

export const colors = {
  bg: "#F7F5EF",
  card: "#FFFFFF",
  border: "#D8D2C5",
  ink: "#163F35",
  muted: "#5B665F",
  soft: "#E4EAD9",
  danger: "#B3261E",
  dangerSoft: "#FBE9E7",
  warn: "#8A5C20",
};

const AVATAR_COLORS = ["#2F6F5E", "#C0652B", "#4A6FA5", "#8E4A8A", "#B08A1F", "#2B7A8C"];

export function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

export function Screen({
  title,
  children,
  scroll = true,
  edges = ["top"],
  right,
}: {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom")[];
  right?: ReactNode;
}) {
  const body = (
    <>
      {title ? (
        <View style={s.titleRow}>
          <Text accessibilityRole="header" style={s.title}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView style={s.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={s.container}>{body}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text style={s.cardTitle}>{children}</Text>;
}

export function Body({ children, tone }: { children: ReactNode; tone?: "warn" | "danger" }) {
  return (
    <Text
      style={[
        s.body,
        tone === "warn" && { color: colors.warn },
        tone === "danger" && { color: colors.danger },
      ]}
    >
      {children}
    </Text>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === "secondary" && s.buttonSecondary,
        variant === "danger" && s.buttonDanger,
        variant === "ghost" && s.buttonGhost,
        inactive && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#FFFFFF" : colors.ink} />
      ) : (
        <Text
          style={[
            s.buttonText,
            (variant === "secondary" || variant === "ghost") && { color: colors.ink },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A938C"
        {...props}
        style={[s.input, error ? { borderColor: colors.danger } : null, props.style]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Avatar({ name, id, size = 40 }: { name: string; id: string; size?: number }) {
  return (
    <View
      accessibilityLabel={`Avatar de ${name}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorForUser(id),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: size * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

export function Banner({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "danger";
}) {
  const bg = tone === "danger" ? colors.dangerSoft : tone === "warn" ? "#FFF3D6" : colors.soft;
  const fg = tone === "danger" ? colors.danger : tone === "warn" ? colors.warn : colors.ink;
  return (
    <View accessibilityRole="alert" style={[s.banner, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink, letterSpacing: -0.8, flexShrink: 1 },
  card: {
    padding: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted },
  button: {
    minHeight: 52,
    backgroundColor: colors.ink,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonSecondary: { backgroundColor: colors.soft },
  buttonDanger: { backgroundColor: colors.danger },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#FFFFFF",
  },
  banner: { padding: 14, borderRadius: 12 },
});
