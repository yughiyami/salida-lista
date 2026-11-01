import { useCallback, useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import type { FieldEvent, NewEvent, Participant } from "../domain/types";
import { createFieldEvent } from "../domain/events";
import {
  persistChecklist,
  persistEvent,
  persistPresence,
  readGuideData,
} from "./database";

export function useGuideData() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<FieldEvent[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    try {
      const data = await readGuideData(db);
      if (mounted.current) {
        setParticipants(data.participants);
        setEvents(data.events);
        setChecklist(data.checklist);
        setError(null);
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo leer la información local.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [db]);
  // Route focus owns loading; do not start a second read on mount.
  const setPresence = useCallback(
    async (id: string, present: boolean) => {
      await persistPresence(db, id, present);
      await refresh();
    },
    [db, refresh],
  );
  const setChecklistValue = useCallback(
    async (key: string, checked: boolean) => {
      await persistChecklist(db, key, checked);
      await refresh();
    },
    [db, refresh],
  );
  const saveEvent = useCallback(
    async (input: NewEvent) => {
      const event = createFieldEvent(
        input,
        randomUUID(),
        new Date().toISOString(),
      );
      await persistEvent(db, event);
      await refresh();
      return event;
    },
    [db, refresh],
  );
  return {
    loading,
    error,
    participants,
    events,
    checklist,
    refresh,
    setPresence,
    setChecklist: setChecklistValue,
    saveEvent,
  };
}
