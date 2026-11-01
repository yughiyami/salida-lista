export type Circle = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

export type CircleMember = {
  circle_id: string;
  user_id: string;
  role: "owner" | "member";
  share_location: boolean;
  joined_at: string;
};

export type MemberProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type MemberLocation = {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  speed_mps: number | null;
  battery_level: number | null;
  is_charging: boolean | null;
  recorded_at: string;
};

export type Place = {
  id: string;
  circle_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  created_by: string | null;
  created_at: string;
};

export type FeedKind = "text" | "checkin" | "sos" | "place";

export type FeedMessage = {
  id: string;
  circle_id: string;
  user_id: string;
  kind: FeedKind;
  body: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  sharing_paused_until: string | null;
  location_consent_at: string | null;
  background_consent_at: string | null;
};
