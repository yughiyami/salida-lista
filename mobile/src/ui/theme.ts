import type { TextStyle, ViewStyle } from "react-native";

// "Señal de ruta": spruce green and trail-marker lime on a cool stone ground,
// like a printed route map read outdoors in daylight.
export const colors = {
  ground: "#F2F4EF",
  surface: "#FFFFFF",
  surfaceAlt: "#E8EDE4",
  line: "#DCE2D6",
  ink: "#10231D",
  inkSoft: "#4F6158",
  spruce: "#0D5B45",
  spruceDeep: "#08382B",
  spruceTint: "#DCEBE3",
  lime: "#C8F169",
  live: "#1FA971",
  stale: "#9AA59E",
  danger: "#C8281E",
  dangerSoft: "#FCE9E6",
  warn: "#8A5A00",
  warnSoft: "#FFF1CC",
  white: "#FFFFFF",
  // Aliases kept for screens written against the first kit.
  bg: "#F2F4EF",
  card: "#FFFFFF",
  border: "#DCE2D6",
  muted: "#4F6158",
  soft: "#DCEBE3",
} as const;

export const fonts = {
  regular: "Figtree_400Regular",
  medium: "Figtree_500Medium",
  semibold: "Figtree_600SemiBold",
  bold: "Figtree_700Bold",
  black: "Figtree_800ExtraBold",
} as const;

export const type = {
  display: { fontFamily: fonts.black, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: colors.ink } satisfies TextStyle,
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: colors.ink } satisfies TextStyle,
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink } satisfies TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkSoft } satisfies TextStyle,
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.ink } satisfies TextStyle,
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.inkSoft } satisfies TextStyle,
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.inkSoft } satisfies TextStyle,
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, color: colors.white } satisfies TextStyle,
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const shadow = {
  card: {
    shadowColor: "#0D2A21",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  } satisfies ViewStyle,
  float: {
    shadowColor: "#0D2A21",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,
};

const AVATAR_COLORS = ["#0D5B45", "#B4541A", "#2F5FA3", "#7B3F8C", "#9A7410", "#1F7A8C"];

export function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}
