import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type StyleSpecification,
} from "@maplibre/maplibre-react-native";
import type { FeatureCollection, Polygon } from "geojson";
import { circlePolygon, computeBounds, type LatLng } from "../domain/geo";
import { initials } from "../domain/geo";
import { colorForUser, colors, fonts, shadow } from "./theme";

// OpenFreeMap serves free OpenStreetMap vector tiles without an API key. If it
// cannot load (offline), the map falls back to a plain background so markers
// and geofences stay usable.
const ONLINE_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: "fallback-bg", type: "background", paint: { "background-color": "#EAEEDF" } },
  ],
};

export type MapMember = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stale: boolean;
  sos: boolean;
  isMe: boolean;
};

export type MapPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
};

type Props = {
  members: MapMember[];
  places?: MapPlace[];
  selectedId?: string | null;
  onSelectMember?: (id: string) => void;
  onPressMap?: (point: LatLng) => void;
  pin?: LatLng | null;
  pinRadius?: number;
  initialCenter?: LatLng;
  focusKey?: string | number;
  style?: object;
};

export function LiveMap({
  members,
  places = [],
  selectedId,
  onSelectMember,
  onPressMap,
  pin,
  pinRadius,
  initialCenter,
  focusKey,
  style,
}: Props) {
  const camera = useRef<CameraRef>(null);
  const [failed, setFailed] = useState(false);

  const target = useMemo(() => {
    const points: LatLng[] = members.map((m) => ({ latitude: m.latitude, longitude: m.longitude }));
    if (pin) points.push(pin);
    return points;
  }, [members, pin]);

  // Re-frame when the caller asks (focusKey) or the selected member changes.
  useEffect(() => {
    const focused = members.find((m) => m.id === selectedId);
    if (focused) {
      camera.current?.easeTo({
        center: [focused.longitude, focused.latitude],
        zoom: 15,
        duration: 500,
      });
      return;
    }
    const bounds = computeBounds(target);
    if (!bounds) return;
    if (target.length === 1) {
      camera.current?.easeTo({
        center: [bounds[0], bounds[1]],
        zoom: 14,
        duration: 500,
      });
    } else {
      camera.current?.fitBounds(bounds, {
        padding: { top: 90, right: 60, bottom: 90, left: 60 },
        duration: 600,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, selectedId]);

  const placeShapes: FeatureCollection<Polygon> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: [
        ...places.map((p) => ({
          type: "Feature" as const,
          properties: { id: p.id },
          geometry: {
            type: "Polygon" as const,
            coordinates: [circlePolygon(p, p.radius_m)],
          },
        })),
        ...(pin && pinRadius
          ? [
              {
                type: "Feature" as const,
                properties: { id: "draft" },
                geometry: {
                  type: "Polygon" as const,
                  coordinates: [circlePolygon(pin, pinRadius)],
                },
              },
            ]
          : []),
      ],
    }),
    [places, pin, pinRadius],
  );

  const center = initialCenter ?? target[0] ?? { latitude: -12.0464, longitude: -77.0428 };

  return (
    <View style={[styles.wrap, style]}>
      <Map
        testID="live-map"
        mapStyle={failed ? FALLBACK_STYLE : ONLINE_STYLE}
        style={styles.map}
        androidView="texture"
        logo={false}
        attribution
        touchPitch={false}
        onDidFailLoadingMap={() => setFailed(true)}
        onPress={(e) => {
          const [lng, lat] = e.nativeEvent.lngLat;
          onPressMap?.({ latitude: lat, longitude: lng });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{
            center: [center.longitude, center.latitude],
            zoom: target.length > 0 ? 14 : 5,
          }}
          minZoom={2}
          maxZoom={19}
        />
        <GeoJSONSource id="place-shapes" data={placeShapes}>
          <Layer
            id="place-fill"
            type="fill"
            paint={{ "fill-color": "#0D5B45", "fill-opacity": 0.16 }}
          />
          <Layer
            id="place-line"
            type="line"
            paint={{ "line-color": "#0D5B45", "line-width": 2 }}
          />
        </GeoJSONSource>
        {places.map((p) => (
          <Marker key={`place-${p.id}`} id={`place-${p.id}`} lngLat={[p.longitude, p.latitude]}>
            <View style={styles.placeTag}>
              <Text style={styles.placeText}>{p.name}</Text>
            </View>
          </Marker>
        ))}
        {pin ? (
          <Marker id="draft-pin" lngLat={[pin.longitude, pin.latitude]}>
            <View style={styles.pin} />
          </Marker>
        ) : null}
        {members.map((m) => {
          const ring = m.sos ? colors.danger : m.stale ? colors.stale : colors.live;
          return (
            <Marker key={m.id} id={`member-${m.id}`} lngLat={[m.longitude, m.latitude]} anchor="bottom">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${m.name}${m.sos ? ", SOS activo" : ""}`}
                onPress={() => onSelectMember?.(m.id)}
                style={styles.markerWrap}
              >
                <View
                  style={[
                    styles.avatar,
                    { borderColor: ring, backgroundColor: m.sos ? colors.danger : colorForUser(m.id) },
                    m.stale && !m.sos && { opacity: 0.7 },
                    selectedId === m.id && styles.avatarSelected,
                  ]}
                >
                  <Text style={styles.avatarText}>{m.sos ? "SOS" : initials(m.name)}</Text>
                </View>
                <View style={[styles.tail, { borderTopColor: ring }]} />
                <View style={styles.nameTag}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {m.isMe ? "Yo" : m.name.split(" ")[0]}
                  </Text>
                </View>
              </Pressable>
            </Marker>
          );
        })}
      </Map>
      {failed ? (
        <View style={styles.offline} pointerEvents="none">
          <Text style={styles.offlineText}>Mapa base sin conexión · las posiciones siguen visibles</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden", backgroundColor: "#E4EADF" },
  map: { flex: 1 },
  markerWrap: { alignItems: "center", paddingHorizontal: 6, minWidth: 56 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    ...shadow.float,
  },
  avatarSelected: { transform: [{ scale: 1.18 }] },
  avatarText: { fontFamily: fonts.bold, color: "#FFFFFF", fontSize: 15 },
  tail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  nameTag: {
    marginTop: 2,
    maxWidth: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    ...shadow.card,
  },
  nameText: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  placeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.spruceDeep,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  placeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.lime },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime,
    borderWidth: 4,
    borderColor: colors.spruceDeep,
  },
  offline: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: colors.warnSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  offlineText: { fontFamily: fonts.semibold, color: colors.warn, fontSize: 12 },
});
