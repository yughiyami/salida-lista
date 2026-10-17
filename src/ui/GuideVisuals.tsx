import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

export const PHOTO_CREDIT = "Foto: McKay Savage · CC BY 2.0";
export const PHOTO_SOURCE =
  "https://commons.wikimedia.org/wiki/File:Peru_-_Salkantay_Trek_091_-_Salkantay_(7339855088).jpg";
export const PHOTO_AUTHOR = "https://www.flickr.com/people/56796376@N00";
export const PHOTO_LICENSE = "https://creativecommons.org/licenses/by/2.0/";

/** Bundled original photo; cover changes the visible framing, not the file. */
export function SalkantayPhoto({ compact = false }: { compact?: boolean }) {
  return (
    <View>
      <Image
        testID="salkantay-photo"
        source={require("../../assets/salkantay.jpg")}
        resizeMode="cover"
        accessibilityLabel="Fotografía real de la montaña Salkantay, de McKay Savage"
        style={[styles.photo, compact && styles.photoCompact]}
      />
      <View style={styles.credit}>
        <Text style={styles.creditText}>{PHOTO_CREDIT}</Text>
        <Text style={styles.creditDetail}>
          Encuadre visual · detalles en Conexiones
        </Text>
      </View>
    </View>
  );
}

// Deterministic drawing, deliberately not based on geographic coordinates.
function contour(cx: number, cy: number, radius: number, index: number) {
  return (
    Array.from({ length: 49 }, (_, step) => {
      const angle = (step / 48) * Math.PI * 2;
      const wobble =
        1 +
        Math.sin(angle * 3 + index * 0.16) * 0.12 +
        Math.cos(angle * 5) * 0.07;
      const x = cx + Math.cos(angle) * radius * wobble;
      const y = cy + Math.sin(angle) * radius * 0.67 * wobble;
      return `${step === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z"
  );
}

export function RouteIllustration() {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapHeading}>
        <Text style={styles.mapKicker}>RECORRIDO DE EJEMPLO · DÍA 2</Text>
        <Text style={styles.mapTitle}>Del abra al bosque</Text>
      </View>
      <Svg
        width="100%"
        height={212}
        viewBox="0 0 340 212"
        accessibilityLabel="Esquema vectorial ilustrativo de tres hitos. No es cartografía y no representa tu posición."
      >
        <Path d="M0 0H340V212H0Z" fill="#F0F0E5" />
        <Path
          d="M-15 128C43 152 56 79 110 69S189 80 208 135 290 208 355 169V230H-15Z"
          fill="#E1E6D6"
        />
        <Path
          d="M-10 185C43 135 90 168 140 130S218 42 264 39 311 67 350 17"
          fill="none"
          stroke="#C8D7D2"
          strokeWidth={14}
          opacity={0.65}
        />
        <G fill="none" stroke="#C9CDB8" strokeWidth={0.75} opacity={0.8}>
          {Array.from({ length: 17 }, (_, i) => (
            <Path key={`a${i}`} d={contour(124, 60, 15 + i * 9, i)} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <Path key={`b${i}`} d={contour(302, 171, 17 + i * 9, i)} />
          ))}
        </G>
        <Path
          d="M36 137C59 143 62 112 92 112S128 69 151 73 184 126 207 132 244 159 298 163"
          fill="none"
          stroke="#FAF9F1"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <Path
          d="M36 137C59 143 62 112 92 112S128 69 151 73 184 126 207 132 244 159 298 163"
          fill="none"
          stroke="#315F4C"
          strokeWidth={3.5}
          strokeDasharray="7 6"
          strokeLinecap="round"
        />
        <Path
          d="M137 42L151 22 165 42M144 33L151 37 158 32"
          fill="none"
          stroke="#315F4C"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={36}
          cy={137}
          r={6}
          fill="#FAF9F1"
          stroke="#315F4C"
          strokeWidth={3}
        />
        <Circle
          cx={151}
          cy={73}
          r={6}
          fill="#FAF9F1"
          stroke="#C18A34"
          strokeWidth={3}
        />
        <Circle
          cx={298}
          cy={163}
          r={6}
          fill="#FAF9F1"
          stroke="#315F4C"
          strokeWidth={3}
        />
        <SvgText x={20} y={165} fill="#294D3D" fontSize={10} fontWeight="600">
          Salkantaypampa
        </SvgText>
        <SvgText
          x={151}
          y={57}
          textAnchor="middle"
          fill="#294D3D"
          fontSize={10}
          fontWeight="600"
        >
          Abra Salkantay
        </SvgText>
        <SvgText
          x={318}
          y={187}
          textAnchor="end"
          fill="#294D3D"
          fontSize={10}
          fontWeight="600"
        >
          Collpapampa
        </SvgText>
      </Svg>
      <View style={styles.mapDisclaimer}>
        <Text style={styles.mapDisclaimerText}>
          Esquema ilustrativo · No usar para navegar
        </Text>
        <Text style={styles.mapDisclaimerDetail}>
          Sin escala, georreferencia ni posición del grupo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: "100%", height: 174, backgroundColor: "#DCE2DC" },
  photoCompact: { height: 124 },
  credit: {
    backgroundColor: "#EDF0E6",
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 2,
  },
  creditText: { fontSize: 10, color: "#4D6655", lineHeight: 14 },
  creditDetail: { fontSize: 9, color: "#6D7A69", lineHeight: 12 },
  mapCard: {
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#DCE1D3",
    borderRadius: 20,
    overflow: "hidden",
  },
  mapHeading: { padding: 17, gap: 4 },
  mapKicker: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: "#73806C",
  },
  mapTitle: {
    fontSize: 20,
    color: "#163F35",
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  mapDisclaimer: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    gap: 3,
    backgroundColor: "#F3EBD9",
  },
  mapDisclaimerText: {
    fontSize: 11,
    color: "#78551E",
    fontWeight: "700",
    lineHeight: 16,
  },
  mapDisclaimerDetail: { fontSize: 10, color: "#7B6A47", lineHeight: 14 },
});
