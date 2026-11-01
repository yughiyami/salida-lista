import { useEffect, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../auth/useSession";
import * as api from "./api";
import type {
  Circle,
  CircleMember,
  FeedMessage,
  MemberLocation,
  MemberProfile,
  Place,
} from "./types";

export const keys = {
  circles: ["circles"] as const,
  members: ["members"] as const,
  profiles: ["profiles"] as const,
  locations: ["locations"] as const,
  places: ["places"] as const,
  settings: ["settings"] as const,
  sos: ["sos"] as const,
  messages: (circleId: string) => ["messages", circleId] as const,
};

export function useCircles() {
  return useQuery({ queryKey: keys.circles, queryFn: api.fetchCircles });
}

export function useMembers() {
  const circles = useCircles();
  const ids = useMemo(() => (circles.data ?? []).map((c) => c.id), [circles.data]);
  return useQuery({
    queryKey: [...keys.members, ids],
    queryFn: () => api.fetchMembers(ids),
    enabled: circles.isSuccess,
  });
}

export function useProfilesById() {
  const members = useMembers();
  const userIds = useMemo(
    () => [...new Set((members.data ?? []).map((m) => m.user_id))],
    [members.data],
  );
  const query = useQuery({
    queryKey: [...keys.profiles, userIds],
    queryFn: () => api.fetchProfiles(userIds),
    enabled: members.isSuccess && userIds.length > 0,
  });
  return useMemo(() => {
    const map = new Map<string, MemberProfile>();
    for (const p of query.data ?? []) map.set(p.id, p);
    return map;
  }, [query.data]);
}

export function useLocations() {
  return useQuery({
    queryKey: keys.locations,
    queryFn: api.fetchLocations,
    refetchInterval: 60_000,
  });
}

export function usePlaces() {
  return useQuery({ queryKey: keys.places, queryFn: api.fetchPlaces });
}

export function useActiveSos() {
  return useQuery({
    queryKey: keys.sos,
    queryFn: api.fetchActiveSos,
    refetchInterval: 60_000,
  });
}

export function useMessages(circleId: string) {
  return useQuery({
    queryKey: keys.messages(circleId),
    queryFn: () => api.fetchMessages(circleId),
  });
}

export function useUserSettings() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api.fetchSettings(userId!),
    enabled: Boolean(userId),
  });
}

/** Members of one circle joined with their profile and last known position. */
export function useCircleRoster(circleId: string | null) {
  const members = useMembers();
  const profiles = useProfilesById();
  const locations = useLocations();
  return useMemo(() => {
    const byUser = new Map<string, MemberLocation>();
    for (const l of locations.data ?? []) byUser.set(l.user_id, l);
    const seen = new Set<string>();
    return (members.data ?? [])
      .filter((m) => circleId === null || m.circle_id === circleId)
      .filter((m) => {
        // In "all circles" view a person who shares two circles appears once.
        if (circleId !== null) return true;
        if (seen.has(m.user_id)) return false;
        seen.add(m.user_id);
        return true;
      })
      .map((m) => ({
        member: m,
        profile: profiles.get(m.user_id) ?? null,
        location: byUser.get(m.user_id) ?? null,
      }));
  }, [members.data, profiles, locations.data, circleId]);
}

function invalidateAll(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: keys.circles });
  void qc.invalidateQueries({ queryKey: keys.members });
  void qc.invalidateQueries({ queryKey: keys.profiles });
  void qc.invalidateQueries({ queryKey: keys.locations });
  void qc.invalidateQueries({ queryKey: keys.places });
}

export function useCircleMutations() {
  const qc = useQueryClient();
  const done = () => invalidateAll(qc);
  return {
    create: useMutation({ mutationFn: api.createCircle, onSuccess: done }),
    join: useMutation({ mutationFn: api.joinCircle, onSuccess: done }),
    leave: useMutation({ mutationFn: api.leaveCircle, onSuccess: done }),
    rotate: useMutation({ mutationFn: api.rotateInviteCode, onSuccess: done }),
    remove: useMutation({
      mutationFn: (v: { circleId: string; userId: string }) =>
        api.removeMember(v.circleId, v.userId),
      onSuccess: done,
    }),
    setSharing: useMutation({
      mutationFn: (v: { circleId: string; share: boolean }) =>
        api.setCircleSharing(v.circleId, v.share),
      onSuccess: done,
    }),
  };
}

/**
 * One realtime channel for the signed-in user. RLS filters what each client
 * receives, so a member only gets events for circles they belong to.
 */
export function useRealtimeSync(onFeedMessage?: (m: FeedMessage) => void) {
  const qc = useQueryClient();
  const userId = useSession((s) => s.user?.id);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`circles:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_locations" }, (payload) => {
        const row = payload.new as MemberLocation | Record<string, never>;
        if (payload.eventType === "DELETE" || !("user_id" in row)) {
          void qc.invalidateQueries({ queryKey: keys.locations });
          return;
        }
        qc.setQueryData<MemberLocation[]>(keys.locations, (old) => {
          const list = old ?? [];
          const rest = list.filter((l) => l.user_id !== row.user_id);
          return [...rest, row as MemberLocation];
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_members" }, () => invalidateAll(qc))
      .on("postgres_changes", { event: "*", schema: "public", table: "places" }, () => {
        void qc.invalidateQueries({ queryKey: keys.places });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as FeedMessage;
        qc.setQueryData<FeedMessage[]>(keys.messages(message.circle_id), (old) =>
          old && !old.some((m) => m.id === message.id) ? [...old, message] : old,
        );
        if (message.kind === "sos") void qc.invalidateQueries({ queryKey: keys.sos });
        onFeedMessage?.(message);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as FeedMessage;
        qc.setQueryData<FeedMessage[]>(keys.messages(message.circle_id), (old) =>
          old?.map((m) => (m.id === message.id ? message : m)),
        );
        if (message.kind === "sos") void qc.invalidateQueries({ queryKey: keys.sos });
      })
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [qc, userId, onFeedMessage]);
}

export type { Circle, CircleMember, FeedMessage, MemberLocation, MemberProfile, Place };
