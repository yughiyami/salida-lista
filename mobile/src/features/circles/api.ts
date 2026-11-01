import { getSupabaseClient } from "../../lib/supabase";
import { mapCircleError } from "./validation";
import type {
  Circle,
  CircleMember,
  FeedMessage,
  MemberLocation,
  MemberProfile,
  Place,
  UserSettings,
} from "./types";

/** Runs a Supabase call and throws a Spanish, user-facing Error on failure. */
async function run<T>(
  call: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  let result;
  try {
    result = await call;
  } catch (e) {
    throw new Error(mapCircleError(e));
  }
  if (result.error) throw new Error(mapCircleError(result.error));
  // void RPCs return null; callers that expect rows get an array/object.
  return result.data as T;
}

export async function fetchCircles(): Promise<Circle[]> {
  const db = getSupabaseClient();
  return run(
    db.from("circles").select("*").order("created_at", { ascending: true }),
  );
}

export async function fetchMembers(circleIds: string[]): Promise<CircleMember[]> {
  if (circleIds.length === 0) return [];
  const db = getSupabaseClient();
  return run(db.from("circle_members").select("*").in("circle_id", circleIds));
}

export async function fetchProfiles(userIds: string[]): Promise<MemberProfile[]> {
  if (userIds.length === 0) return [];
  const db = getSupabaseClient();
  return run(
    db.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
  );
}

export async function createCircle(name: string): Promise<Circle> {
  const db = getSupabaseClient();
  return run(db.rpc("create_circle", { p_name: name }));
}

export async function joinCircle(code: string): Promise<Circle> {
  const db = getSupabaseClient();
  const circle = await run<Circle | null>(db.rpc("join_circle", { p_code: code }));
  // The RPC returns an all-null row for an unknown code (see the migration).
  if (!circle || !circle.id) throw new Error(mapCircleError({ message: "invalid_invite_code" }));
  return circle;
}

export async function leaveCircle(circleId: string): Promise<void> {
  const db = getSupabaseClient();
  await run(db.rpc("leave_circle", { p_circle: circleId }));
}

export async function rotateInviteCode(circleId: string): Promise<string> {
  const db = getSupabaseClient();
  return run(db.rpc("rotate_invite_code", { p_circle: circleId }));
}

export async function removeMember(circleId: string, userId: string): Promise<void> {
  const db = getSupabaseClient();
  await run(
    db.rpc("remove_circle_member", { p_circle: circleId, p_user: userId }),
  );
}

export async function setCircleSharing(circleId: string, share: boolean): Promise<void> {
  const db = getSupabaseClient();
  await run(db.rpc("set_circle_sharing", { p_circle: circleId, p_share: share }));
}

export async function fetchLocations(): Promise<MemberLocation[]> {
  const db = getSupabaseClient();
  return run(db.from("user_locations").select("*"));
}

export async function fetchPlaces(): Promise<Place[]> {
  const db = getSupabaseClient();
  return run(db.from("places").select("*").order("created_at", { ascending: true }));
}

export async function createPlace(input: {
  circle_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  created_by: string;
}): Promise<Place> {
  const db = getSupabaseClient();
  return run(db.from("places").insert(input).select("*").single<Place>());
}

export async function deletePlace(placeId: string): Promise<void> {
  const db = getSupabaseClient();
  await run(db.from("places").delete().eq("id", placeId));
}

export async function fetchMessages(circleId: string, limit = 80): Promise<FeedMessage[]> {
  const db = getSupabaseClient();
  const rows = await run(
    db
      .from("messages")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
  return (rows as FeedMessage[]).reverse();
}

export async function fetchActiveSos(): Promise<FeedMessage[]> {
  const db = getSupabaseClient();
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  return run(
    db
      .from("messages")
      .select("*")
      .eq("kind", "sos")
      .is("resolved_at", null)
      .gt("created_at", since)
      .order("created_at", { ascending: false }),
  );
}

export async function sendText(circleId: string, userId: string, body: string): Promise<void> {
  const db = getSupabaseClient();
  await run(
    db.from("messages").insert({
      circle_id: circleId,
      user_id: userId,
      kind: "text",
      body,
    }),
  );
}

export async function sendCheckin(
  circleId: string | null,
  position: { latitude: number; longitude: number } | null,
): Promise<number> {
  const db = getSupabaseClient();
  return run(
    db.rpc("send_checkin", {
      p_circle: circleId,
      p_latitude: position?.latitude ?? null,
      p_longitude: position?.longitude ?? null,
    }),
  );
}

export async function sendSos(
  position: { latitude: number; longitude: number } | null,
): Promise<number> {
  const db = getSupabaseClient();
  return run(
    db.rpc("send_sos", {
      p_latitude: position?.latitude ?? null,
      p_longitude: position?.longitude ?? null,
    }),
  );
}

export async function resolveSos(circleId: string | null = null): Promise<number> {
  const db = getSupabaseClient();
  return run(db.rpc("resolve_sos", { p_circle: circleId }));
}

export async function fetchSettings(userId: string): Promise<UserSettings | null> {
  const db = getSupabaseClient();
  return run(
    db
      .from("user_settings")
      .select("user_id, sharing_paused_until, location_consent_at, background_consent_at")
      .eq("user_id", userId)
      .maybeSingle<UserSettings>(),
  );
}

export async function updateLocationSettings(args: {
  grantLocation?: boolean;
  grantBackground?: boolean;
  pauseMinutes?: number;
  resume?: boolean;
}): Promise<UserSettings> {
  const db = getSupabaseClient();
  return run(
    db.rpc("update_location_settings", {
      p_grant_location: args.grantLocation ?? null,
      p_grant_background: args.grantBackground ?? null,
      p_pause_minutes: args.pauseMinutes ?? null,
      p_resume: args.resume ?? false,
    }),
  );
}

export async function exportMyData(): Promise<unknown> {
  const db = getSupabaseClient();
  return run(db.rpc("export_my_data"));
}

export async function deleteMyAccount(): Promise<void> {
  const db = getSupabaseClient();
  await run(db.rpc("delete_my_account"));
}

export async function saveExpoPushToken(userId: string, token: string, platform: string): Promise<void> {
  const db = getSupabaseClient();
  await run(
    db
      .from("push_tokens")
      .upsert({ token, user_id: userId, platform, updated_at: new Date().toISOString() }),
  );
}
