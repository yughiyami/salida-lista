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
import { colorForUser } from "./kit";
import { initials } from "../domain/geo";

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
            paint={{ "fill-color": "#2F6F5E", "fill-opacity": 0.18 }}
          />
          <Layer
            id="place-line"
            type="line"
            paint={{ "line-color": "#2F6F5E", "line-width": 2 }}
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
        {members.map((m) => (
          <Marker key={m.id} id={`member-${m.id}`} lngLat={[m.longitude, m.latitude]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${m.name}${m.sos ? ", SOS activo" : ""}`}
              onPress={() => onSelectMember?.(m.id)}
              style={[
                styles.avatar,
                { backgroundColor: m.sos ? "#B3261E" : colorForUser(m.id) },
                m.stale && { opacity: 0.55 },
                selectedId === m.id && styles.avatarSelected,
              ]}
            >
              <Text style={styles.avatarText}>{m.sos ? "SOS" : initials(m.name)}</Text>
            </Pressable>
          </Marker>
        ))}
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
  wrap: { flex: 1, overflow: "hidden", backgroundColor: "#EAEEDF" },
  map: { flex: 1 },
  avatar: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarSelected: { borderColor: "#163F35" },
  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  placeTag: {
    backgroundColor: "#FFFFFFEE",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#2F6F5E",
  },
  placeText: { fontSize: 11, fontWeight: "600", color: "#163F35" },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#C0652B",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  offline: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    backgroundColor: "#FFF3D6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  offlineText: { color: "#8A5C20", fontSize: 12 },
});
