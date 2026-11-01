import type { FieldEvent, NewEvent, Position } from "./types";

const eventTypes = new Set(["HITO", "DEMORA", "INCIDENCIA", "RETORNO"]);

export function validatePosition(position: Position | null): void {
  if (!position) return;
  if (
    !Number.isFinite(position.latitude) ||
    Math.abs(position.latitude) > 90 ||
    !Number.isFinite(position.longitude) ||
    Math.abs(position.longitude) > 180 ||
    (position.accuracy !== null &&
      (!Number.isFinite(position.accuracy) || position.accuracy < 0)) ||
    !Number.isFinite(Date.parse(position.capturedAt))
  ) {
    throw new Error(
      "La ubicación no es válida. Puedes guardar el evento sin ubicación.",
    );
  }
}

export function createFieldEvent(
  input: NewEvent,
  id: string,
  now: string,
): FieldEvent {
  if (!eventTypes.has(input.type))
    throw new Error("Selecciona un tipo de evento válido.");
  const note = input.note.trim();
  if (!note) throw new Error("Describe brevemente lo ocurrido.");
  if (note.length > 2000)
    throw new Error("La descripción admite hasta 2000 caracteres.");
  if (!id || !Number.isFinite(Date.parse(now)))
    throw new Error("No se pudo identificar el evento.");
  validatePosition(input.position);
  return {
    id,
    type: input.type,
    note,
    occurredAt: now,
    position: input.position,
    status: "LOCAL_PENDING",
  };
}

export function formatReport(event: FieldEvent): string {
  const p = event.position;
  return [
    "SALIDA LISTA · DEMOSTRACIÓN · NO ES UN SOS",
    "Salida: Salkantay · SL-DEMO-001",
    `Evento: ${event.id}`,
    `Tipo: ${event.type}`,
    `Registrado (UTC): ${event.occurredAt}`,
    `Posición: ${p ? `${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}` : "NO DISPONIBLE"}`,
    ...(p
      ? [
          `Capturada (UTC): ${p.capturedAt}`,
          `Precisión: ${p.accuracy === null ? "no disponible" : `${Math.round(p.accuracy)} m`}`,
        ]
      : []),
    `Detalle: ${event.note}`,
    "Solicita confirmación humana de recepción y seguimiento.",
    "La aplicación no ha verificado entrega ni aceptación.",
  ].join("\n");
}
