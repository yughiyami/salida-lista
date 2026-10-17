import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type StyleSpecification,
} from "@maplibre/maplibre-react-native";
import type { FeatureCollection, Point } from "geojson";
import { AppIcon } from "./AppIcon";
import { OFFLINE_MAP_PACKAGES, isInsidePackage } from "../domain/offlineMaps";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "local-background",
      type: "background",
      paint: { "background-color": "#F0F0E5" },
    },
  ],
};
const STALE_AFTER_MS = 30_000;
const NATIONAL_LABEL_ORDER = ["Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Puno", "Tacna"];
type Fix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export function OfflineGuideMap() {
  const camera = useRef<CameraRef>(null);
  const [selectedId, setSelectedId] = useState(OFFLINE_MAP_PACKAGES[0].id);
  const selected = OFFLINE_MAP_PACKAGES.find((pack) => pack.id === selectedId)!;
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const generation = useRef(0);
  const permissionIntent = useRef(0);
  const focused = useRef(false);
  const mounted = useRef(true);
  const [starting, setStarting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const stop = useCallback(() => {
    generation.current += 1;
    subscription.current?.remove();
    subscription.current = null;
    if (mounted.current) {
      setTracking(false);
      setStarting(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const app = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    const interval = setInterval(() => {
      if (focused.current) setNow(Date.now());
    }, 5000);
    return () => {
      mounted.current = false;
      permissionIntent.current += 1;
      stop();
      clearInterval(interval);
      app.remove();
    };
  }, [stop]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        permissionIntent.current += 1;
        stop();
      };
    }, [stop]),
  );

  const activate = async () => {
    if (
      starting ||
      tracking ||
      !focused.current ||
      AppState.currentState !== "active"
    )
      return;
    const intent = ++permissionIntent.current;
    const ownsIntent = () =>
      mounted.current && focused.current && intent === permissionIntent.current;
    let permissionPhase = true;
    let current = generation.current;
    const isCurrent = () =>
      mounted.current &&
      focused.current &&
      current === generation.current &&
      AppState.currentState === "active";
    setStarting(true);
    setError(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Check before requesting permission: Android 17 can otherwise open a
      // global-location modal even when this app already has permission.
      const servicesBeforePermission = await Location.hasServicesEnabledAsync();
      if (!ownsIntent()) return;
      if (!servicesBeforePermission)
        throw new Error(
          "La ubicación del teléfono está desactivada. El mapa local sigue disponible.",
        );
      const permissions = await Location.requestForegroundPermissionsAsync();
      // Android permission activities may background the app and invalidate a
      // watch token. The permission result belongs to this explicit tap, not
      // that old watch. Never start a watch from an AppState resume listener.
      if (!ownsIntent()) return;
      if (!permissions.granted)
        throw new Error(
          "GPS no autorizado. Puedes seguir consultando el mapa offline; revisa los permisos del teléfono si deseas activarlo.",
        );
      if (AppState.currentState !== "active")
        throw new Error(
          "Permiso concedido. Pulsa Activar GPS cuando estés de nuevo en esta pantalla; no se activará automáticamente al volver.",
        );
      permissionPhase = false;
      current = ++generation.current;
      setStarting(true);
      const services = await Location.hasServicesEnabledAsync();
      if (!isCurrent()) return;
      if (!services)
        throw new Error(
          "La ubicación del teléfono está desactivada. El mapa local sigue disponible.",
        );
      const pending = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
          // Standalone GNSS must not require Android's network provider.
          mayShowUserSettingsDialog: false,
        },
        (result) => {
          if (!isCurrent()) return;
          const { latitude, longitude, accuracy } = result.coords;
          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(result.timestamp)
          )
            return;
          setFix({
            latitude,
            longitude,
            accuracy,
            timestamp: result.timestamp,
          });
          // A fresh fix supersedes transient centering/stale-position errors.
          // The current out-of-coverage warning is derived from this fix below.
          setError(null);
          setNow(Date.now());
        },
        (reason) => {
          if (isCurrent()) {
            setError(`No se pudo actualizar el GPS: ${reason}`);
            stop();
          }
        },
      );
      // A native watch that resolves after cancellation is removed immediately.
      pending.then(
        (result) => {
          if (!isCurrent()) result.remove();
        },
        () => {},
      );
      const result = await Promise.race([
        pending,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "No pudimos activar el GPS en 20 segundos. El mapa sigue disponible sin posición; puedes reintentar.",
                ),
              ),
            20_000,
          );
        }),
      ]);
      if (!isCurrent()) {
        result.remove();
        return;
      }
      subscription.current = result;
      setTracking(true);
    } catch (e) {
      if (permissionPhase ? ownsIntent() : isCurrent()) {
        setError(e instanceof Error ? e.message : "No pudimos activar el GPS.");
        stop();
      }
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (ownsIntent()) setStarting(false);
    }
  };
  const stale = !!fix && (!tracking || now - fix.timestamp > STALE_AFTER_MS);
  const outside = !!fix && !isInsidePackage(selected, fix);
  const point: FeatureCollection<Point> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: fix
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [fix.longitude, fix.latitude],
              },
            },
          ]
        : [],
    }),
    [fix],
  );
  const labels = useMemo(
    () =>
      selected.data.features
        .filter(
          (feature) =>
            feature.geometry.type === "Point" &&
            feature.properties?.name &&
            (feature.properties?.place ||
              feature.properties?.natural === "peak" ||
              feature.properties?.tourism === "viewpoint"),
        )
        .sort((a, b) => {
          const rank = (properties: typeof a.properties) => {
            const priority = selected.id === "peru-referencia" ? NATIONAL_LABEL_ORDER.indexOf(String(properties?.name)) : -1;
            return priority >= 0 ? 10_000_000_000 - priority * 100_000_000 : Number(String(properties?.population ?? "0").replace(/[^0-9]/g, ""));
          };
          return rank(b.properties) - rank(a.properties);
        })
        .slice(0, 9),
    [selected],
  );
  const centerOnFix = () => {
    if (!fix || stale) {
      setError("Espera una posición GPS reciente para centrar el mapa.");
      return;
    }
    // A fresh fix may be centered anywhere, even without local basemap data.
    camera.current?.easeTo({
      center: [fix.longitude, fix.latitude],
      zoom: 14,
      duration: 400,
    });
  };

  return (
    <View style={s.card}>
      <View style={s.heading}>
        <Text style={s.kicker}>CARTOGRAFÍA LIBRE · OPENSTREETMAP</Text>
        <Text style={s.title}>{selected.name}</Text>
        <Text style={s.small}>
          No cambia la salida de demostración Salkantay. Caminos y referencias reales; no es una ruta certificada ni navegación
          giro a giro.
        </Text>
      </View>
      <View style={s.packages}>
        <Text style={s.small}>{selected.detail}</Text>
        {OFFLINE_MAP_PACKAGES.map((pack) => (
          <Pressable
            key={pack.id}
            accessibilityRole="button"
            accessibilityLabel={`Mapa offline: ${pack.name}`}
            accessibilityState={{ selected: pack.id === selectedId }}
            onPress={() => {
              setSelectedId(pack.id);
              setError(null);
              camera.current?.easeTo({ center: pack.center, zoom: pack.zoom, duration: 400 });
            }}
            style={[s.packageButton, pack.id === selectedId && s.packageSelected]}
          >
            <Text style={[s.packageText, pack.id === selectedId && s.packageSelectedText]}>{pack.name}</Text>
          </Pressable>
        ))}
        <Text style={s.small}>{OFFLINE_MAP_PACKAGES.length} paquetes incluidos · sin descarga. Selección temporal; una pantalla nueva inicia Arequipa metropolitana.</Text>
      </View>
      <View style={s.mapClip}>
        <Map
          testID="offline-native-map"
          mapStyle={MAP_STYLE}
          style={s.map}
          androidView="texture"
          attribution={false}
          logo={false}
          compass
          scaleBar
          touchPitch={false}
          onDidFailLoadingMap={() => setMapError(true)}
          onDidFinishLoadingMap={() => setMapError(false)}
        >
          <Camera
            ref={camera}
            initialViewState={{ center: selected.center, zoom: selected.zoom }}
            minZoom={2}
            maxZoom={17}
          />
          <GeoJSONSource id="offline-local" data={selected.data}>
            <Layer id="reference-border" type="line" filter={["has", "reference_boundary"]} paint={{ "line-color": "#849B82", "line-width": 1.2 }} />
            <Layer
              id="local-land"
              type="fill"
              filter={["==", ["geometry-type"], "Polygon"]}
              paint={{
                "fill-color": [
                  "match",
                  ["get", "natural"],
                  "water",
                  "#B9D6D5",
                  "glacier",
                  "#E1EDF0",
                  "wood",
                  "#CCDABD",
                  "#E0E5D4",
                ],
                "fill-opacity": 0.8,
              }}
            />
            <Layer
              id="local-water"
              type="line"
              filter={[
                "all",
                ["==", ["geometry-type"], "LineString"],
                ["has", "waterway"],
              ]}
              paint={{ "line-color": "#87B6C0", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.3, 12, 0.8, 16, 1.6] }}
            />
            <Layer
              id="local-roads-casing"
              type="line"
              filter={[
                "all",
                ["==", ["geometry-type"], "LineString"],
                ["has", "highway"],
              ]}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": "#FFFCF2", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 8, 1.2, 12, 1.8, 16, 4.8] }}
            />
            <Layer
              id="local-roads"
              type="line"
              filter={[
                "all",
                ["==", ["geometry-type"], "LineString"],
                ["has", "highway"],
                [
                  "!",
                  [
                    "in",
                    ["get", "highway"],
                    ["literal", ["path", "footway", "steps", "bridleway"]],
                  ],
                ],
              ]}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": "#BD9B64", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 8, 0.7, 12, 1.1, 16, 2.4] }}
            />
            <Layer
              id="local-trails"
              type="line"
              filter={[
                "all",
                ["==", ["geometry-type"], "LineString"],
                [
                  "in",
                  ["get", "highway"],
                  ["literal", ["path", "footway", "steps", "bridleway"]],
                ],
              ]}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#426951",
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 1.2, 17, 2],
                "line-dasharray": [2, 2],
              }}
            />
          </GeoJSONSource>
          {labels.map((feature, i) => (
            <Marker
              key={`${selected.id}-place-${i}`}
              id={`place-${i}`}
              lngLat={
                (feature.geometry as Point).coordinates as [number, number]
              }
            >
              <View style={s.place}>
                <Text style={s.placeText}>
                  {String(feature.properties?.name)}
                </Text>
              </View>
            </Marker>
          ))}
          {fix && (
            <GeoJSONSource id="guide-fix" data={point}>
              <Layer
                id="guide-fix-halo"
                type="circle"
                paint={{
                  "circle-radius": 10,
                  "circle-color": stale ? "#C18A34" : "#327899",
                  "circle-opacity": 0.22,
                }}
              />
              <Layer
                id="guide-fix-point"
                type="circle"
                paint={{
                  "circle-radius": 5,
                  "circle-color": stale ? "#A57629" : "#267FA5",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#FFFFFF",
                }}
              />
            </GeoJSONSource>
          )}
        </Map>
      </View>
      {mapError && (
        <Text accessibilityRole="alert" style={s.error}>
          No se pudo dibujar el mapa nativo. Los eventos locales siguen
          disponibles.
        </Text>
      )}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendLine, s.trailLine]} />
          <Text style={s.legendText}>Senderos OSM</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendLine, s.roadLine]} />
          <Text style={s.legendRoad}>Caminos</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendLine, s.waterLine]} />
          <Text style={s.legendWater}>Agua</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Créditos y licencia de OpenStreetMap"
        onPress={() => {
          void Linking.openURL("https://www.openstreetmap.org/copyright").catch(
            () =>
              setError(
                "Créditos: © OpenStreetMap contributors · ODbL · openstreetmap.org/copyright. Abrir el enlace requiere conexión.",
              ),
          );
        }}
        style={s.attribution}
      >
        <Text style={s.attributionText}>
          © OpenStreetMap contributors · ODbL
        </Text>
        <AppIcon name="externalLink" size={12} color="#557562" />
      </Pressable>
      {selected.id === "peru-referencia" && <Text style={[s.small, { paddingHorizontal: 15 }]}>Contorno: Natural Earth v5.1.2 · dominio público · referencial.</Text>}
      <View style={s.controls}>
        <Pressable
          testID="toggle-map-gps"
          accessibilityRole="button"
          accessibilityLabel={tracking ? "Desactivar GPS" : "Activar GPS"}
          accessibilityState={{ disabled: starting }}
          disabled={starting}
          onPress={() => (tracking ? stop() : void activate())}
          style={[s.button, starting && s.disabled]}
        >
          <AppIcon
            name={tracking ? "gpsOff" : "locate"}
            size={20}
            color="#FFFDF8"
          />
          <Text style={s.buttonText}>
            {starting
              ? "Activando…"
              : tracking
                ? "Desactivar GPS"
                : "Activar GPS"}
          </Text>
        </Pressable>
        <Pressable
          testID="center-map-gps"
          accessibilityRole="button"
          accessibilityLabel="Centrar mapa en mi posición"
          onPress={centerOnFix}
          style={[s.button, s.secondary]}
        >
          <AppIcon name="crosshair" size={20} />
          <Text style={s.secondaryText}>Centrar en mí</Text>
        </Pressable>
      </View>
      <View style={s.status}>
        <Text style={s.statusTitle}>
          {tracking
            ? fix
              ? stale
                ? "Posición antigua"
                : "GPS en primer plano"
              : "GPS activo · esperando posición"
            : "GPS desactivado"}
        </Text>
        {fix ? (
          <>
            <Text selectable style={s.small}>
              {fix.latitude.toFixed(6)}, {fix.longitude.toFixed(6)} · ±{" "}
              {fix.accuracy === null
                ? "precisión no disponible"
                : `${Math.round(fix.accuracy)} m`}
            </Text>
            <Text style={s.small}>
              Capturada:{" "}
              {new Date(fix.timestamp).toLocaleTimeString("es-PE", {
                timeZone: "America/Lima",
                hour12: false,
              })}{" "}
              · hora Perú{stale ? " · no actual" : ""}
            </Text>
            {outside && (
              <Text style={s.warning}>
                Fuera del paquete seleccionado. Puedes centrar el GPS, registrar eventos y asistencia; el fondo quedará sin cartografía.
              </Text>
            )}
          </>
        ) : (
          <Text style={s.small}>
            Sin posición capturada. No se utiliza una ubicación de demostración.
          </Text>
        )}
        <Text style={s.small}>
          Se detiene al salir de esta pantalla o enviar la app al fondo. No se
          comparte tu posición.
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <Text style={s.coverage}>
          {selected.detail} Límites (O, S, E, N): {selected.bounds.join(", ")}.
          No garantiza todas las calles ni senderos. Datos OSM parciales; no indican
          transitabilidad ni seguridad. El GPS y el registro local no están
          bloqueados por los límites del mapa ni por una ruta.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE1D3",
    backgroundColor: "#FFFDF8",
  },
  heading: { padding: 17, gap: 6 },
  packages: { paddingHorizontal: 15, paddingBottom: 14, gap: 7 },
  packageButton: { minHeight: 44, justifyContent: "center", borderRadius: 10, padding: 11, backgroundColor: "#EBEFE3" },
  packageSelected: { backgroundColor: "#163F35" },
  packageText: { color: "#163F35", fontSize: 12, fontWeight: "600" },
  packageSelectedText: { color: "#FFFDF8" },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "700",
    color: "#667A64",
  },
  title: { fontSize: 21, fontWeight: "600", color: "#163F35" },
  mapClip: { height: 292, width: "100%", overflow: "hidden" },
  map: { flex: 1, width: "100%" },
  small: { fontSize: 11, lineHeight: 17, color: "#5E7163" },
  place: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#FFFDF1E8",
    borderWidth: 1,
    borderColor: "#D5DCCB",
    maxWidth: 130,
  },
  placeText: { color: "#335642", fontSize: 9, fontWeight: "600" },
  legend: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingTop: 10,
    gap: 10,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendLine: { width: 15, height: 0, borderTopWidth: 2 },
  trailLine: { borderTopColor: "#426951", borderStyle: "dashed" },
  roadLine: { borderTopColor: "#856739" },
  waterLine: { borderTopColor: "#517F8C" },
  legendText: { fontSize: 10, color: "#426951" },
  legendRoad: { fontSize: 10, color: "#856739" },
  legendWater: { fontSize: 10, color: "#517F8C" },
  attribution: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  attributionText: {
    fontSize: 10,
    color: "#557562",
    textDecorationLine: "underline",
  },
  controls: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  button: {
    flexDirection: "row",
    gap: 7,
    minHeight: 46,
    flex: 1,
    backgroundColor: "#163F35",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  buttonText: {
    flexShrink: 1,
    color: "#FFFDF8",
    fontSize: 12,
    fontWeight: "600",
  },
  secondary: { backgroundColor: "#EBEFE3" },
  secondaryText: {
    flexShrink: 1,
    color: "#163F35",
    fontSize: 12,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  status: { padding: 15, gap: 6 },
  statusTitle: { fontSize: 12, color: "#163F35", fontWeight: "700" },
  warning: { fontSize: 11, lineHeight: 17, color: "#8A5C20" },
  error: { fontSize: 12, lineHeight: 18, color: "#8D3927", padding: 5 },
  coverage: { fontSize: 10, color: "#7A7F6D", lineHeight: 16, marginTop: 5 },
});







