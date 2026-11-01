export type EventType = "HITO" | "DEMORA" | "INCIDENCIA" | "RETORNO";
export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
};
export type Participant = {
  id: string;
  name: string;
  present: boolean;
  groupName: string;
};
export type FieldEvent = {
  id: string;
  type: EventType;
  note: string;
  occurredAt: string;
  position: Position | null;
  status: "LOCAL_PENDING";
};
export type NewEvent = {
  type: EventType;
  note: string;
  position: Position | null;
};
