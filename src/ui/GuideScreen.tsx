import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import {
  PHOTO_AUTHOR,
  PHOTO_CREDIT,
  PHOTO_LICENSE,
  PHOTO_SOURCE,
  SalkantayPhoto,
} from "./GuideVisuals";
import { OfflineGuideMap } from "./OfflineGuideMap";
import { AppIcon, type AppIconName } from "./AppIcon";
import { useGuideData } from "../data/useGuideData";
import type { EventType, Position } from "../domain/types";
import { formatReport } from "../domain/events";

type Screen =
  | "home"
  | "prepare"
  | "route"
  | "participants"
  | "event"
  | "pending"
  | "settings";
const titles: Record<Screen, string> = {
  home: "Mis salidas",
  prepare: "Preparar salida",
  route: "En ruta",
  participants: "Participantes",
  event: "Registrar evento",
  pending: "Partes locales",
  settings: "Conexiones",
};
const eventLabels: Record<EventType, string> = {
  HITO: "Hito",
  DEMORA: "Demora",
  INCIDENCIA: "Incidencia",
  RETORNO: "Retorno",
};
const paths = {
  home: "/",
  prepare: "/preparar",
  route: "/ruta",
  participants: "/participantes",
  event: "/evento",
  pending: "/pendientes",
  settings: "/ajustes",
} as const;
const checkItems = [
  [
    "participants",
    "Participantes revisados",
    "Confirma la presencia de cada persona.",
  ],
  [
    "route",
    "Ficha y protocolo locales",
    "Revisa los datos de demostración en este teléfono.",
  ],
  [
    "equipment",
    "Equipo verificado",
    "Verificación manual; la app no certifica el equipo.",
  ],
  [
    "channel",
    "Canal alternativo revisado",
    "Confirma el medio real con tu agencia.",
  ],
] as const;

function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  testID,
  icon,
  iconPosition = "start",
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
  icon?: AppIconName;
  iconPosition?: "start" | "end";
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.buttonSecondary,
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
    >
      {icon && iconPosition === "start" && (
        <AppIcon
          name={icon}
          size={20}
          color={secondary ? "#163F35" : "#FFFDF8"}
        />
      )}
      <Text style={[s.buttonText, secondary && s.buttonSecondaryText]}>
        {title}
      </Text>
      {icon && iconPosition === "end" && (
        <AppIcon
          name={icon}
          size={20}
          color={secondary ? "#163F35" : "#FFFDF8"}
        />
      )}
    </Pressable>
  );
}
function Notice({
  children,
  warning = false,
}: {
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <View style={[s.notice, warning && s.warning]}>
      <Text style={[s.small, warning && s.warningText]}>{children}</Text>
    </View>
  );
}
function Card({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return <View style={[s.card, dark && s.darkCard]}>{children}</View>;
}
function Section({ children }: { children: React.ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}
function timestamp(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function capturePositionWithTimeout(): Promise<Location.LocationObject> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // The native request cannot be cancelled here. Only the race result is used,
    // so a result arriving after the timeout never updates the captured position.
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: false,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                "No obtuvimos una posición en 20 segundos. Puedes guardar sin ubicación o volver a intentar al aire libre.",
              ),
            ),
          20_000,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export function GuideScreen({ screen }: { screen: Screen }) {
  const router = useRouter();
  const data = useGuideData();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eventType, setEventType] = useState<EventType>("HITO");
  const [note, setNote] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const refresh = data.refresh;
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  const go = (next: Screen) => {
    if (next !== screen) router.push(paths[next]);
  };
  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await operation();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos completar la acción. Intenta nuevamente.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const capture = () =>
    void run(async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Ubicación no autorizada. Puedes guardar el evento sin ubicación. Para habilitarla, revisa los permisos del teléfono.",
        );
      if (!(await Location.hasServicesEnabledAsync()))
        throw new Error(
          "Activa la ubicación del teléfono o guarda el evento sin posición.",
        );
      const result = await capturePositionWithTimeout();
      setPosition({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        capturedAt: new Date(result.timestamp).toISOString(),
      });
      setSuccess(
        "Posición capturada una vez. No hay seguimiento en segundo plano.",
      );
    });
  const present = data.participants.filter((p) => p.present).length;
  const completed = checkItems.filter(([key]) => data.checklist[key]).length;
  const renderPosition = () => (
    <View style={s.positionBox}>
      <Text style={s.label}>POSICIÓN CAPTURADA</Text>
      {position ? (
        <>
          <Text selectable style={s.body}>
            {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
          </Text>
          <Text style={s.small}>
            {timestamp(position.capturedAt)} · precisión{" "}
            {position.accuracy === null
              ? "no disponible"
              : `${Math.round(position.accuracy)} m`}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setPosition(null)}
            style={s.textButton}
          >
            <Text style={s.link}>Quitar posición</Text>
          </Pressable>
        </>
      ) : (
        <Text style={s.small}>
          Sin capturar. Se solicita solo cuando tú lo decides.
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              screen === "home" ? "Inicio de Salida Lista" : "Volver"
            }
            onPress={() =>
              screen !== "home" &&
              (router.canGoBack() ? router.back() : router.replace("/"))
            }
            style={s.back}
          >
            {screen === "home" ? (
              <Image
                source={require("../../assets/brand/salida-lista-mark.png")}
                resizeMode="contain"
                style={s.brandMark}
                accessible={false}
              />
            ) : (
              <AppIcon name="arrowLeft" color="#FFFDF8" />
            )}
          </Pressable>
          <View style={s.brand}>
            <Text style={s.brandName}>SALIDA LISTA</Text>
            <Text style={s.brandSub}>Cuida el recorrido.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir conexiones y credenciales"
            onPress={() => go("settings")}
            style={s.settings}
          >
            <AppIcon name="ellipsis" />
          </Pressable>
        </View>
        <View style={s.demoRow}>
          <View style={s.demoDot} />
          <Text style={s.demoText}>MODO DEMOSTRACIÓN · DATOS LOCALES</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.eyebrow}>
            {screen === "route" ? "CAMPO · RUTA O MODO LIBRE" : "GUÍA DE CAMPO"}
          </Text>
          <Text
            accessibilityRole="header"
            style={[s.title, screen === "route" && s.routeTitle]}
          >
            {titles[screen]}
          </Text>
          {(error || data.error) && (
            <View accessibilityRole="alert" style={s.error}>
              <Text style={s.errorText}>{error || data.error}</Text>
            </View>
          )}
          {success && (
            <View accessibilityLiveRegion="polite" style={s.notice}>
              <Text style={s.small}>{success}</Text>
            </View>
          )}
          {data.loading ? (
            <View style={s.loading}>
              <ActivityIndicator color="#163F35" />
              <Text style={s.small}>Abriendo los datos del teléfono…</Text>
            </View>
          ) : (
            <>
              {screen === "home" && (
                <>
                  <Text style={s.subtitle}>
                    Buen día, guía. La montaña también es nuestro trabajo.
                  </Text>
                  <View style={s.photoCard}>
                    <SalkantayPhoto />
                    <View style={s.photoCardBody}>
                      <Text style={s.label}>
                        CUSCO, PERÚ · SALIDA DE DEMOSTRACIÓN
                      </Text>
                      <Text style={s.tripName}>Salkantay</Text>
                      <Text style={s.tripDetails}>
                        5 días · {data.participants.length} participantes · Día
                        2
                      </Text>
                      <View style={s.offlineChip}>
                        <Text style={s.offlineChipText}>
                          Ficha local disponible sin internet
                        </Text>
                      </View>
                      <Button
                        title="Preparar salida"
                        icon="arrowRight"
                        iconPosition="end"
                        onPress={() => go("prepare")}
                      />
                    </View>
                  </View>
                  <Notice warning>
                    Ejemplo ficticio. No conectado a Bókun ni a una agencia. No
                    hay monitoreo remoto activo.
                  </Notice>
                  <Button
                    title="Abrir recorrido de ejemplo"
                    icon="map"
                    secondary
                    onPress={() => go("route")}
                  />
                  <Section>EN ESTE TELÉFONO</Section>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => go("pending")}
                    style={s.summaryRow}
                  >
                    <View>
                      <Text style={s.cardTitle}>Partes pendientes</Text>
                      <Text style={s.small}>
                        Guardados, sin recepción verificada
                      </Text>
                    </View>
                    <View style={s.countRow}>
                      <Text style={s.count}>{data.events.length}</Text>
                      <AppIcon name="chevronRight" size={22} />
                    </View>
                  </Pressable>
                </>
              )}
              {screen === "prepare" && (
                <>
                  <Text style={s.subtitle}>
                    Salkantay · Día 2. Comprueba antes de partir.
                  </Text>
                  <View style={s.preparePhoto}>
                    <SalkantayPhoto compact />
                  </View>
                  <Card>
                    <View style={s.rowBetween}>
                      <Text style={s.cardTitle}>Antes de partir</Text>
                      <Text style={s.progress}>{completed} / 4</Text>
                    </View>
                    <View style={s.progressTrack}>
                      <View
                        style={[
                          s.progressFill,
                          { width: `${completed * 25}%` },
                        ]}
                      />
                    </View>
                    {checkItems.map(([key, label, description]) => (
                      <Pressable
                        key={key}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked: !!data.checklist[key],
                          disabled: busy,
                        }}
                        disabled={busy}
                        onPress={() =>
                          void run(() =>
                            data.setChecklist(key, !data.checklist[key]),
                          )
                        }
                        style={s.checkRow}
                      >
                        <View
                          style={[
                            s.checkbox,
                            data.checklist[key] && s.checkboxChecked,
                          ]}
                        >
                          {data.checklist[key] && (
                            <AppIcon name="check" size={18} color="#FFFDF8" />
                          )}
                        </View>
                        <View style={s.flex}>
                          <Text style={s.bodyStrong}>{label}</Text>
                          <Text style={s.small}>{description}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </Card>
                  <Button
                    title={`Revisar participantes · ${present}/${data.participants.length}`}
                    icon="users"
                    secondary
                    onPress={() => go("participants")}
                  />
                  <Notice warning>
                    Guardia no activada. No existe un backend conectado que
                    reciba o acepte esta salida.
                  </Notice>
                  <Button
                    title="Abrir recorrido de ejemplo"
                    icon="map"
                    onPress={() => go("route")}
                  />
                </>
              )}
              {screen === "route" && (
                <>
                  <Notice warning>
                    Guardia no activada · No hay recepción remota disponible.
                  </Notice>
                  <Notice>Modo libre disponible: registra eventos y asistencia en cualquier lugar, aunque no exista una ruta o un mapa de esa zona. El grupo sigue siendo de demostración.</Notice>
                  <OfflineGuideMap />
                  <View style={s.statRow}>
                    <View style={s.stat}>
                      <Text style={s.statValue}>
                        {present}/{data.participants.length}
                      </Text>
                      <Text style={s.small}>presentes registrados</Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statValue}>{data.events.length}</Text>
                      <Text style={s.small}>partes locales</Text>
                    </View>
                  </View>
                  {renderPosition()}
                  <Button
                    title={
                      busy ? "Obteniendo posición…" : "Capturar mi posición"
                    }
                    icon="crosshair"
                    secondary
                    disabled={busy}
                    onPress={capture}
                  />
                  <Button
                    title="Ver participantes"
                    icon="users"
                    secondary
                    onPress={() => go("participants")}
                  />
                  <Section>PROTOCOLO LOCAL DE DEMOSTRACIÓN</Section>
                  <Text style={s.body}>
                    Mantén al grupo con su responsable. Ante una incidencia,
                    utiliza el protocolo y los medios reales acordados por tu
                    agencia. Este ejemplo no sustituye un plan de emergencia ni
                    proporciona instrucciones médicas.
                  </Text>
                  <Text style={s.small}>
                    La app no determina si hay cobertura ni ofrece rescate.
                  </Text>
                </>
              )}
              {screen === "participants" && (
                <>
                  <Text style={s.subtitle}>
                    Marca presencia física. No es localización individual.
                  </Text>
                  <View style={s.summaryRow}>
                    <Text style={s.cardTitle}>Grupo de ejemplo</Text>
                    <Text style={s.progress}>
                      {present} / {data.participants.length}
                    </Text>
                  </View>
                  {data.participants.map((person, index) => (
                    <Pressable
                      key={person.id}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`${person.name}, presente`}
                      accessibilityState={{
                        checked: person.present,
                        disabled: busy,
                      }}
                      disabled={busy}
                      onPress={() =>
                        void run(() =>
                          data.setPresence(person.id, !person.present),
                        )
                      }
                      style={s.person}
                    >
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>
                          {String(index + 1).padStart(2, "0")}
                        </Text>
                      </View>
                      <View style={s.flex}>
                        <Text style={s.bodyStrong}>{person.name}</Text>
                        <Text style={s.small}>
                          {person.groupName} · ejemplo
                        </Text>
                      </View>
                      <View
                        style={[
                          s.checkbox,
                          person.present && s.checkboxChecked,
                        ]}
                      >
                        {person.present && (
                          <AppIcon name="check" size={18} color="#FFFDF8" />
                        )}
                      </View>
                    </Pressable>
                  ))}
                  <Notice>
                    Los cambios se guardan en este teléfono. Desmarcar no genera
                    una alerta de desaparición.
                  </Notice>
                </>
              )}
              {screen === "event" && (
                <>
                  <Text style={s.subtitle}>
                    Registra primero, dentro o fuera de ruta y sin mapa. Comunica cuando exista un canal.
                  </Text>
                  <Section>TIPO DE EVENTO</Section>
                  <View style={s.chips}>
                    {(Object.keys(eventLabels) as EventType[]).map((type) => (
                      <Pressable
                        key={type}
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: eventType === type,
                          disabled: busy,
                        }}
                        disabled={busy}
                        onPress={() => setEventType(type)}
                        style={[s.chip, eventType === type && s.chipSelected]}
                      >
                        <Text
                          style={[
                            s.chipText,
                            eventType === type && s.chipSelectedText,
                          ]}
                        >
                          {eventLabels[type]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={s.inputLabel}>¿Qué ocurrió?</Text>
                  <TextInput
                    accessibilityLabel="Descripción del evento"
                    value={note}
                    onChangeText={setNote}
                    editable={!busy}
                    multiline
                    maxLength={2000}
                    placeholder="Describe el hecho, el grupo y quién se hace cargo…"
                    placeholderTextColor="#777F77"
                    style={s.input}
                    textAlignVertical="top"
                  />
                  <Text style={s.charCount}>
                    {note.length}/2000 · evita datos sensibles innecesarios
                  </Text>
                  {renderPosition()}
                  <Button
                    title={
                      busy
                        ? "Procesando…"
                        : position
                          ? "Actualizar posición"
                          : "Adjuntar mi posición (opcional)"
                    }
                    icon="crosshair"
                    secondary
                    onPress={capture}
                    disabled={busy}
                  />
                  <Notice>
                    Se guarda en SQLite. No se envía a operaciones y no activa
                    ayuda automática.
                  </Notice>
                  <Button
                    title={busy ? "Guardando…" : "Guardar en este teléfono"}
                    icon="save"
                    disabled={busy || !note.trim()}
                    onPress={() =>
                      void run(async () => {
                        await data.saveEvent({
                          type: eventType,
                          note: note.trim(),
                          position,
                        });
                        setNote("");
                        setPosition(null);
                        Alert.alert(
                          "Guardado en este teléfono",
                          "El evento sigue pendiente. Puedes preparar un parte desde Partes locales.",
                          [
                            {
                              text: "Ver partes",
                              onPress: () => router.replace("/pendientes"),
                            },
                          ],
                        );
                      })
                    }
                  />
                </>
              )}
              {screen === "pending" && (
                <>
                  <Text style={s.subtitle}>
                    Guardado no significa enviado, recibido ni aceptado.
                  </Text>
                  <Notice warning>
                    No hay servidor conectado. Compartir un texto no verifica su
                    entrega. Los registros permanecen pendientes.
                  </Notice>
                  {data.events.length === 0 ? (
                    <Card>
                      <Text style={s.cardTitle}>Todavía no hay partes</Text>
                      <Text style={s.body}>
                        Registra un hito o una incidencia. Permanecerá
                        disponible al reiniciar la app.
                      </Text>
                      <Button
                        title="Registrar primer evento"
                        icon="plus"
                        onPress={() => go("event")}
                      />
                    </Card>
                  ) : (
                    data.events.map((event) => (
                      <Card key={event.id}>
                        <View style={s.rowBetween}>
                          <Text style={s.cardTitle}>
                            {eventLabels[event.type]}
                          </Text>
                          <Text style={s.localBadge}>LOCAL</Text>
                        </View>
                        <Text style={s.small}>
                          {timestamp(event.occurredAt)} · hora Perú
                        </Text>
                        <Text selectable style={s.eventNote}>
                          {event.note}
                        </Text>
                        <Text style={s.small}>
                          {event.position
                            ? `Posición adjunta · precisión ${event.position.accuracy === null ? "no disponible" : `${Math.round(event.position.accuracy)} m`}`
                            : "Sin posición adjunta"}
                        </Text>
                        <Text selectable style={s.eventId}>
                          ID: {event.id}
                        </Text>
                        <Button
                          title="Compartir parte de texto"
                          icon="share"
                          secondary
                          disabled={busy}
                          onPress={() =>
                            void run(async () => {
                              await Share.share({
                                message: formatReport(event),
                              });
                              setSuccess(
                                "El parte sigue guardado localmente. Elige WhatsApp si está disponible y verifica allí el envío. No podemos confirmar recepción.",
                              );
                            })
                          }
                        />
                      </Card>
                    ))
                  )}
                </>
              )}
              {screen === "settings" && (
                <>
                  <Text style={s.subtitle}>
                    Conexiones reales pendientes. Ningún secreto se guarda en
                    esta pantalla.
                  </Text>
                  <Card>
                    <View style={s.rowBetween}>
                      <Text style={s.cardTitle}>Bókun</Text>
                      <Text style={s.localBadge}>NO CONECTADO</Text>
                    </View>
                    <Text style={s.body}>
                      Necesitamos una cuenta autorizada del operador y acceso
                      API aprobado. La clave de acceso y el secreto se
                      configuran exclusivamente en el backend.
                    </Text>
                    <Text style={s.small}>
                      La salida de demostración no fue importada de Bókun.
                    </Text>
                  </Card>
                  <Card>
                    <View style={s.rowBetween}>
                      <Text style={s.cardTitle}>WhatsApp</Text>
                      <Text style={s.localBadge}>MANUAL</Text>
                    </View>
                    <Text style={s.body}>
                      Puedes compartir un parte con el selector del teléfono. La
                      recepción automática necesita una cuenta empresarial de
                      Meta, número habilitado, Phone Number ID, WABA ID, token
                      de servidor, App Secret y webhook HTTPS.
                    </Text>
                    <Text style={s.small}>
                      No leemos chats ni comprobamos entregas. No se solicitan
                      tokens en el celular.
                    </Text>
                  </Card>
                  <Card>
                    <Text style={s.cardTitle}>
                      Límites de esta primera versión
                    </Text>
                    <Text style={s.body}>
                      Datos locales sin cifrado adicional. Usa solo información
                      ficticia. El mapa OSM local incluye cinco extractos acotados de Arequipa, Colca y Salkantay; no ofrece navegación ni rutas certificadas. Sin
                      captura de fotos, audio, satélite integrado, conexión
                      entre celulares ni seguimiento en segundo plano.
                    </Text>
                  </Card>
                  <Card>
                    <Text style={s.cardTitle}>Crédito de la fotografía</Text>
                    <Text style={s.body}>{PHOTO_CREDIT}</Text>
                    <Text style={s.small}>
                      Salkantay, Perú. Archivo original incluido sin modificar.
                      Solo se ajusta el encuadre visual con cover. Sin relación
                      ni aval del autor al producto.
                    </Text>
                    <Text selectable style={s.creditLink}>
                      Autor: {PHOTO_AUTHOR}
                    </Text>
                    <Text selectable style={s.creditLink}>
                      Licencia: {PHOTO_LICENSE}
                    </Text>
                    <Text selectable style={s.creditLink}>
                      Fuente: {PHOTO_SOURCE}
                    </Text>
                  </Card>
                  <Notice>
                    WhatsApp satelital y el intercambio local entre celulares
                    requieren pruebas de campo y compatibilidad. No están
                    implementados.
                  </Notice>
                </>
              )}
            </>
          )}
          <Text style={s.footer}>
            SALIDA LISTA · PROTOTIPO DE CAMPO
            {busy ? " · Guardando o procesando…" : ""}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      {screen === "route" && (
        <View style={s.fixedAction}>
          <View style={s.fixedActionInner}>
            <Button
              testID="register-event-fixed"
              title="Registrar evento"
              icon="plus"
              onPress={() => go("event")}
            />
          </View>
        </View>
      )}
      <View style={s.nav}>
        {(
          [
            { key: "home", label: "Salidas", icon: "backpack" },
            { key: "route", label: "En ruta", icon: "route" },
            { key: "pending", label: "Partes", icon: "clipboard" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: screen === item.key }}
            onPress={() => go(item.key)}
            style={[s.navItem, screen === item.key && s.navItemActive]}
          >
            <AppIcon
              name={item.icon}
              size={24}
              color={screen === item.key ? "#163F35" : "#7A8775"}
            />
            <Text style={[s.navLabel, screen === item.key && s.navActive]}>
              {item.label}
              {item.key === "pending" && data.events.length > 0
                ? ` (${data.events.length})`
                : ""}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  routeTitle: { fontSize: 28 },
  photoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE2D4",
    backgroundColor: "#FFFDF8",
    overflow: "hidden",
  },
  photoCardBody: { padding: 18, gap: 12 },
  tripName: {
    fontSize: 30,
    lineHeight: 35,
    color: "#163F35",
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  tripDetails: {
    fontSize: 14,
    color: "#536B59",
    lineHeight: 21,
    marginTop: -5,
  },
  offlineChip: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: "#E4EAD9",
    borderRadius: 9,
  },
  offlineChipText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#31543E",
    fontWeight: "600",
  },
  preparePhoto: {
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE2D4",
  },
  fixedAction: {
    backgroundColor: "#F7F5EF",
    borderTopWidth: 1,
    borderTopColor: "#DCE2D3",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  fixedActionInner: { width: "100%", maxWidth: 572, alignSelf: "center" },
  creditLink: { fontSize: 11, lineHeight: 17, color: "#4E6855" },
  safe: { flex: 1, backgroundColor: "#F7F5EF" },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    borderBottomColor: "#E5E5DA",
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#163F35",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandMark: { width: 44, height: 44 },
  backText: { color: "#FFF", fontSize: 19, fontWeight: "700" },
  brand: { flex: 1 },
  brandName: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#163F35",
  },
  brandSub: { fontSize: 11, color: "#68766C", marginTop: 3 },
  settings: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { color: "#163F35", fontSize: 21 },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 13,
  },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C18A34" },
  demoText: {
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "700",
    color: "#7D642D",
  },
  content: {
    padding: 24,
    gap: 14,
    paddingBottom: 32,
    maxWidth: 620,
    alignSelf: "center",
    width: "100%",
  },
  eyebrow: {
    color: "#64756B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#163F35",
    letterSpacing: -1,
    marginTop: -3,
  },
  subtitle: { color: "#627268", fontSize: 15, lineHeight: 23, marginBottom: 5 },
  card: {
    padding: 20,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#E0E3D8",
    borderRadius: 22,
    gap: 12,
  },
  darkCard: { backgroundColor: "#163F35", borderColor: "#163F35", padding: 24 },
  darkEyebrow: {
    color: "#C1D4B9",
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#F9F5E9",
    fontSize: 39,
    fontWeight: "600",
    letterSpacing: -1.4,
  },
  heroSubtitle: { color: "#D1D9C9", fontSize: 14, marginTop: -7 },
  heroDivider: { height: 1, backgroundColor: "#3F5B4A", marginVertical: 6 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  darkLabel: { fontSize: 9, letterSpacing: 1.1, color: "#B3C2AB" },
  darkBody: { color: "#FFFDF8", fontSize: 17, fontWeight: "600", marginTop: 5 },
  heroChip: {
    alignSelf: "flex-start",
    backgroundColor: "#2F5547",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  heroChipText: { color: "#E8EDDB", fontSize: 11, fontWeight: "600" },
  notice: { padding: 15, backgroundColor: "#EAF0E4", borderRadius: 12 },
  warning: {
    backgroundColor: "#F3EBD9",
    borderLeftWidth: 3,
    borderLeftColor: "#C18A34",
  },
  warningText: { color: "#755420" },
  small: { fontSize: 12, color: "#66746A", lineHeight: 19 },
  body: { fontSize: 14, lineHeight: 23, color: "#334D41" },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 22,
    color: "#1C3F33",
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    gap: 9,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#163F35",
    borderRadius: 14,
    padding: 14,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#BBC8B8",
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFDF8",
    textAlign: "center",
  },
  buttonSecondaryText: { color: "#163F35" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  section: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: "#66766B",
    fontWeight: "700",
    marginTop: 12,
  },
  summaryRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE2D5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#163F35" },
  count: { color: "#163F35", fontSize: 22, fontWeight: "600" },
  progress: { color: "#80642B", fontWeight: "700", fontSize: 15 },
  progressTrack: {
    height: 4,
    backgroundColor: "#E6E9DE",
    borderRadius: 3,
    marginBottom: 2,
  },
  progressFill: { height: 4, backgroundColor: "#C18A34", borderRadius: 3 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EADF",
  },
  checkbox: {
    width: 27,
    height: 27,
    borderWidth: 1.5,
    borderColor: "#A8B8A6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#163F35", borderColor: "#163F35" },
  checkmark: { color: "#FFFDF8", fontSize: 17, fontWeight: "600" },
  label: {
    fontSize: 9,
    color: "#6C7A69",
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  routeIllustration: { height: 164, marginTop: 2 },
  routeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  routeLabel: { fontSize: 9, color: "#4C6554", fontWeight: "600" },
  caption: { fontSize: 11, lineHeight: 17, color: "#778271" },
  statRow: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: "#EAEDE1",
    padding: 17,
    borderRadius: 16,
    gap: 4,
  },
  statValue: { color: "#163F35", fontSize: 28, fontWeight: "600" },
  positionBox: {
    borderWidth: 1,
    borderColor: "#D9DFD1",
    padding: 16,
    borderRadius: 14,
    gap: 7,
  },
  textButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
  },
  link: { color: "#80642B", fontSize: 13, fontWeight: "600" },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E4D8",
    minHeight: 76,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#E7EBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, color: "#516C56", fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#CCD5C4",
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 12,
  },
  chipSelected: { backgroundColor: "#163F35", borderColor: "#163F35" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#4E6554" },
  chipSelectedText: { color: "#FFFDF8" },
  inputLabel: {
    fontSize: 14,
    color: "#163F35",
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    minHeight: 145,
    borderWidth: 1,
    borderColor: "#BCCAB4",
    borderRadius: 14,
    padding: 17,
    backgroundColor: "#FFFDF8",
    fontSize: 15,
    color: "#163F35",
    lineHeight: 23,
  },
  charCount: { fontSize: 10, color: "#768171", textAlign: "right" },
  localBadge: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: "#7D5D25",
    fontWeight: "700",
    backgroundColor: "#F1E8D3",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  eventNote: {
    fontSize: 15,
    lineHeight: 23,
    color: "#294A3A",
    marginVertical: 3,
  },
  eventId: { color: "#7A8577", fontSize: 9 },
  error: { backgroundColor: "#F6E4DC", padding: 15, borderRadius: 12 },
  errorText: { color: "#8D3927", fontSize: 13, lineHeight: 20 },
  loading: { paddingVertical: 60, gap: 16, alignItems: "center" },
  footer: {
    fontSize: 9,
    color: "#8A9382",
    textAlign: "center",
    letterSpacing: 1.3,
    marginTop: 16,
    lineHeight: 17,
  },
  nav: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#DCE2D3",
    backgroundColor: "#F7F5EF",
  },
  navItem: {
    flex: 1,
    minHeight: 51,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  countRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  navItemActive: { backgroundColor: "#E6ECDD", borderRadius: 12 },
  navSymbol: { fontSize: 23, color: "#899383", lineHeight: 26 },
  navLabel: { fontSize: 10, color: "#7A8775", fontWeight: "600" },
  navActive: { color: "#163F35" },
});

