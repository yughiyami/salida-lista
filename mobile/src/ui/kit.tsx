import { useState, type ComponentType, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Info } from "lucide-react-native";
import { initials } from "../domain/geo";
import { Topo } from "./Topo";
import { colorForUser, colors, fonts, radius, shadow, type } from "./theme";

export { colorForUser, colors, fonts, radius, shadow, type };

type IconType = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

/** Text that always carries the app font; variants map to the type scale. */
export function Text({
  variant = "body",
  style,
  ...props
}: TextProps & { variant?: keyof typeof type }) {
  return <RNText {...props} style={[type[variant], style]} />;
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  edges = ["top"],
  right,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom")[];
  right?: ReactNode;
}) {
  const header = title ? (
    <View style={s.header}>
      <View style={s.headerTopo}>
        <Topo color={colors.spruce} opacity={0.16} rings={9} seed={2} />
      </View>
      <View style={s.headerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" variant="display">
            {title}
          </Text>
          {subtitle ? <Text variant="body">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={s.safe} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {header}
          <View style={s.body}>{children}</View>
        </ScrollView>
      ) : (
        <View style={s.container}>
          {header}
          <View style={s.body}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text variant="heading">{children}</Text>;
}

export function Body({ children, tone }: { children: ReactNode; tone?: "warn" | "danger" }) {
  return (
    <Text
      variant="body"
      style={[tone === "warn" && { color: colors.warn }, tone === "danger" && { color: colors.danger }]}
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
  variant?: "primary" | "secondary" | "danger" | "ghost" | "lime";
  accessibilityLabel?: string;
  icon?: IconType;
};

export function Button({ label, onPress, loading, disabled, variant = "primary", accessibilityLabel, icon: Icon }: ButtonProps) {
  const inactive = disabled || loading;
  const filled = variant === "primary" || variant === "danger";
  const fg = filled ? colors.white : colors.spruceDeep;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === "secondary" && { backgroundColor: colors.spruceTint },
        variant === "danger" && { backgroundColor: colors.danger },
        variant === "lime" && { backgroundColor: colors.lime },
        variant === "ghost" && { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.line },
        inactive && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon ? <Icon color={fg} size={20} strokeWidth={2.2} /> : null}
          <Text variant="button" style={{ color: fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = "light",
  size = 48,
}: {
  icon: IconType;
  label: string;
  onPress: () => void;
  tone?: "light" | "dark" | "danger";
  size?: number;
}) {
  const bg = tone === "dark" ? colors.spruceDeep : tone === "danger" ? colors.danger : colors.white;
  const fg = tone === "light" ? colors.spruceDeep : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" },
        shadow.float,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      <Icon color={fg} size={size * 0.46} strokeWidth={2.2} />
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" style={{ color: colors.ink }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7C8A82"
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          s.input,
          focused && { borderColor: colors.spruce, backgroundColor: colors.white },
          error ? { borderColor: colors.danger } : null,
          props.style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" variant="small" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Avatar with a status ring: live (green), stale (grey) or SOS (red). */
export function Avatar({
  name,
  id,
  size = 44,
  status,
}: {
  name: string;
  id: string;
  size?: number;
  status?: "live" | "stale" | "sos" | "none";
}) {
  const ring = status === "sos" ? colors.danger : status === "live" ? colors.live : status === "stale" ? colors.stale : "transparent";
  const inner = size - (status && status !== "none" ? 8 : 0);
  return (
    <View
      accessibilityLabel={`Avatar de ${name}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: status && status !== "none" ? 3 : 0,
        borderColor: ring,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
      }}
    >
      <View
        style={{
          width: inner - (status && status !== "none" ? 2 : 0),
          height: inner - (status && status !== "none" ? 2 : 0),
          borderRadius: size,
          backgroundColor: status === "sos" ? colors.danger : colorForUser(id),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.bold, color: colors.white, fontSize: size * 0.34 }}>{initials(name)}</Text>
      </View>
    </View>
  );
}

export function Pill({ children, tone = "neutral", icon: Icon }: { children: ReactNode; tone?: "neutral" | "live" | "warn" | "danger"; icon?: IconType }) {
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.inkSoft },
    live: { bg: "#D6F3E4", fg: "#0B6B45" },
    warn: { bg: colors.warnSoft, fg: colors.warn },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  return (
    <View style={[s.pill, { backgroundColor: map.bg }]}>
      {Icon ? <Icon color={map.fg} size={13} strokeWidth={2.4} /> : null}
      <Text variant="caption" style={{ color: map.fg }}>
        {children}
      </Text>
    </View>
  );
}

export function Banner({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "danger" }) {
  const bg = tone === "danger" ? colors.dangerSoft : tone === "warn" ? colors.warnSoft : colors.spruceTint;
  const fg = tone === "danger" ? colors.danger : tone === "warn" ? colors.warn : colors.spruceDeep;
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <View accessibilityRole="alert" style={[s.banner, { backgroundColor: bg }]}>
      <Icon color={fg} size={20} strokeWidth={2.2} />
      <Text variant="small" style={{ color: fg, flex: 1, fontSize: 14, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[s.segment, active && s.segmentActive]}
          >
            <Text variant="bodyStrong" style={{ color: active ? colors.white : colors.inkSoft }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  container: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 18, overflow: "hidden" },
  headerTopo: { ...StyleSheet.absoluteFill },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  body: { paddingHorizontal: 20, gap: 14 },
  card: {
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: 12,
    ...shadow.card,
  },
  button: {
    minHeight: 54,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.spruce,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#F8FAF6",
  },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: radius.md },
  segmented: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.md - 4 },
  segmentActive: { backgroundColor: colors.spruce },
});
