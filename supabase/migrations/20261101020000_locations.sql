-- Phases 3-4: live location, consent, pause and the batched upload endpoint
-- used by the offline queue. Only members of a circle that the owner of the
-- location still shares with can read a position.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sharing_paused_until timestamptz,
  location_consent_at timestamptz,
  background_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.user_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m real check (accuracy_m is null or accuracy_m >= 0),
  speed_mps real check (speed_mps is null or speed_mps >= 0),
  battery_level real check (battery_level is null or battery_level between 0 and 1),
  is_charging boolean,
  recorded_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.location_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_m real,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, recorded_at)
);

create index if not exists location_history_recorded_idx
  on public.location_history (recorded_at);

alter table public.user_locations enable row level security;
alter table public.location_history enable row level security;

-- A viewer sees a position only when: they share a circle with the owner,
-- the owner keeps sharing enabled for that circle and has not paused sharing.
create or replace function private.can_see_location(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) = p_owner
    or (
      exists (
        select 1
        from public.circle_members viewer
        join public.circle_members owner_row on owner_row.circle_id = viewer.circle_id
        where viewer.user_id = (select auth.uid())
          and owner_row.user_id = p_owner
          and owner_row.share_location
      )
      and not exists (
        select 1 from public.user_settings s
        where s.user_id = p_owner
          and s.sharing_paused_until is not null
          and s.sharing_paused_until > now()
      )
    );
$$;

revoke all on function private.can_see_location(uuid) from public, anon;
grant execute on function private.can_see_location(uuid) to authenticated;

drop policy if exists user_locations_select_visible on public.user_locations;
create policy user_locations_select_visible on public.user_locations
  for select to authenticated
  using (private.can_see_location(user_id));

drop policy if exists location_history_select_own on public.location_history;
create policy location_history_select_own on public.location_history
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Batched upload used by the foreground tracker, the background task and the
-- offline queue. Accepts up to 200 points; the newest one becomes the live
-- position. Returns how many points were accepted.
create or replace function public.push_locations(p_points jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_point jsonb;
  v_lat double precision;
  v_lng double precision;
  v_at timestamptz;
  v_latest jsonb := null;
  v_latest_at timestamptz := '-infinity';
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if jsonb_typeof(p_points) <> 'array' or jsonb_array_length(p_points) > 200 then
    raise exception 'invalid_batch' using errcode = '22023';
  end if;

  -- Paused or without consent: accept silently so a stale client queue drains
  -- without storing anything.
  if exists (
    select 1 from public.user_settings s
    where s.user_id = v_uid
      and s.sharing_paused_until is not null
      and s.sharing_paused_until > now()
  ) then
    return 0;
  end if;
  if not exists (
    select 1 from public.user_settings s
    where s.user_id = v_uid and s.location_consent_at is not null
  ) then
    return 0;
  end if;

  for v_point in select * from jsonb_array_elements(p_points) loop
    begin
      v_lat := (v_point->>'latitude')::double precision;
      v_lng := (v_point->>'longitude')::double precision;
      v_at := (v_point->>'recorded_at')::timestamptz;
    exception when others then
      continue;
    end;

    if v_lat not between -90 and 90 or v_lng not between -180 and 180 then
      continue;
    end if;
    -- Ignore clocks in the far future (+5 min tolerance) and points older than 7 days.
    if v_at > now() + interval '5 minutes' or v_at < now() - interval '7 days' then
      continue;
    end if;

    insert into public.location_history (user_id, latitude, longitude, accuracy_m, recorded_at)
    values (v_uid, v_lat, v_lng, nullif(v_point->>'accuracy_m', '')::real, v_at)
    on conflict (user_id, recorded_at) do nothing;

    v_count := v_count + 1;
    if v_at > v_latest_at then
      v_latest := v_point;
      v_latest_at := v_at;
    end if;
  end loop;

  if v_latest is not null then
    insert into public.user_locations as ul
      (user_id, latitude, longitude, accuracy_m, speed_mps, battery_level, is_charging, recorded_at, updated_at)
    values (
      v_uid,
      (v_latest->>'latitude')::double precision,
      (v_latest->>'longitude')::double precision,
      nullif(v_latest->>'accuracy_m', '')::real,
      case when coalesce(nullif(v_latest->>'speed_mps', '')::real, -1) >= 0
           then (v_latest->>'speed_mps')::real end,
      nullif(v_latest->>'battery_level', '')::real,
      nullif(v_latest->>'is_charging', '')::boolean,
      v_latest_at,
      now()
    )
    on conflict (user_id) do update set
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      accuracy_m = excluded.accuracy_m,
      speed_mps = excluded.speed_mps,
      battery_level = excluded.battery_level,
      is_charging = excluded.is_charging,
      recorded_at = excluded.recorded_at,
      updated_at = now()
    where ul.recorded_at <= excluded.recorded_at;
  end if;

  return v_count;
end;
$$;

-- Consent and pause live in one RPC so timestamps come from the server clock.
create or replace function public.update_location_settings(
  p_grant_location boolean default null,
  p_grant_background boolean default null,
  p_pause_minutes integer default null,
  p_resume boolean default false
)
returns public.user_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.user_settings;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.user_settings (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.user_settings set
    location_consent_at = case
      when p_grant_location is true then coalesce(location_consent_at, now())
      when p_grant_location is false then null
      else location_consent_at end,
    background_consent_at = case
      when p_grant_background is true then coalesce(background_consent_at, now())
      when p_grant_background is false then null
      else background_consent_at end,
    sharing_paused_until = case
      when p_resume then null
      when p_pause_minutes is not null and p_pause_minutes > 0
        then now() + make_interval(mins => least(p_pause_minutes, 60 * 24 * 7))
      else sharing_paused_until end,
    updated_at = now()
  where user_id = v_uid
  returning * into v_row;

  -- Withdrawing consent also removes the stored live position.
  if p_grant_location is false then
    delete from public.user_locations where user_id = v_uid;
  end if;

  return v_row;
end;
$$;

revoke all on function public.push_locations(jsonb) from public, anon;
revoke all on function public.update_location_settings(boolean, boolean, integer, boolean) from public, anon;
grant execute on function public.push_locations(jsonb) to authenticated;
grant execute on function public.update_location_settings(boolean, boolean, integer, boolean) to authenticated;
