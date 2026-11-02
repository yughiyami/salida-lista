import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  color?: string;
  opacity?: number;
  rings?: number;
  seed?: number;
};

const W = 400;
const H = 300;

/** Deterministic topographic contour lines: the brand's signature texture. */
export function Topo({ color = "#C8F169", opacity = 0.22, rings = 11, seed = 1 }: Props) {
  const paths = useMemo(() => {
    const out: string[] = [];
    const cx = W * 0.78;
    const cy = H * 0.38;
    for (let i = 1; i <= rings; i++) {
      const base = 18 + i * 24;
      const pts: string[] = [];
      const steps = 72;
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const wobble =
          1 +
          0.1 * Math.sin(3 * a + i * 0.55 + seed) +
          0.06 * Math.sin(5 * a - i * 0.8 + seed * 2) +
          0.03 * Math.sin(9 * a + i);
        const r = base * wobble;
        pts.push(`${s === 0 ? "M" : "L"}${(cx + Math.cos(a) * r * 1.25).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
      }
      out.push(`${pts.join(" ")} Z`);
    }
    return out;
  }, [rings, seed]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeOpacity={i % 4 === 0 ? opacity * 1.6 : opacity}
            strokeWidth={i % 4 === 0 ? 1.6 : 1}
          />
        ))}
      </Svg>
    </View>
  );
}
