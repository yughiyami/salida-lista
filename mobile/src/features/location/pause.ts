export const PAUSE_OPTIONS = [
  { label: "15 minutos", minutes: 15 },
  { label: "1 hora", minutes: 60 },
  { label: "8 horas", minutes: 8 * 60 },
  { label: "24 horas", minutes: 24 * 60 },
] as const;

export function describePause(
  pausedUntilIso: string | null | undefined,
  nowMs: number,
): { paused: boolean; label: string } {
  const until = pausedUntilIso ? Date.parse(pausedUntilIso) : NaN;
  if (!Number.isFinite(until) || until <= nowMs) {
    return { paused: false, label: "Compartiendo" };
  }
  const minutes = Math.ceil((until - nowMs) / 60_000);
  if (minutes < 60) return { paused: true, label: `En pausa · ${minutes} min` };
  const hours = Math.ceil(minutes / 60);
  return { paused: true, label: `En pausa · ${hours} h` };
}
