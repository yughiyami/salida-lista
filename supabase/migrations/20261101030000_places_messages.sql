-- Phases 5-6: places (geofences), the circle feed (chat, arrivals, check-ins,
-- SOS), push tokens and the database-side push fan-out.

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 40),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 150 check (radius_m between 50 and 5000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists places_circle_idx on public.places (circle_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'checkin', 'sos', 'place')),
  body text not null check (char_length(body) between 1 and 500),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  place_id uuid references public.places(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_circle_created_idx
  on public.messages (circle_id, created_at desc);

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android',
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.places enable row level security;
alter table public.messages enable row level security;
alter table public.push_tokens enable row level security;

-- Places -------------------------------------------------------------------

drop policy if exists places_select_member on public.places;
create policy places_select_member on public.places
  for select to authenticated
  using (private.is_circle_member(circle_id));

drop policy if exists places_insert_member on public.places;
create policy places_insert_member on public.places
  for insert to authenticated
  with check (private.is_circle_member(circle_id) and created_by = (select auth.uid()));

drop policy if exists places_update_creator_or_owner on public.places;
create policy places_update_creator_or_owner on public.places
  for update to authenticated
  using (
    created_by = (select auth.uid())
    or exists (select 1 from public.circles c
               where c.id = circle_id and c.owner_id = (select auth.uid()))
  )
  with check (private.is_circle_member(circle_id));

drop policy if exists places_delete_creator_or_owner on public.places;
create policy places_delete_creator_or_owner on public.places
  for delete to authenticated
  using (
    created_by = (select auth.uid())
    or exists (select 1 from public.circles c
               where c.id = circle_id and c.owner_id = (select auth.uid()))
  );

-- Messages: members read; they can only insert plain text as themselves.
-- check-ins, SOS and arrivals are created by RPCs below.

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages
  for select to authenticated
  using (private.is_circle_member(circle_id));

drop policy if exists messages_insert_text on public.messages;
create policy messages_insert_text on public.messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and kind = 'text'
    and private.is_circle_member(circle_id)
  );

-- Push tokens ----------------------------------------------------------------

drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RPCs -------------------------------------------------------------------------

create or replace function public.send_checkin(
  p_circle uuid default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text;
  v_count integer := 0;
  c record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select display_name into v_name from public.profiles where id = v_uid;

  for c in
    select m.circle_id from public.circle_members m
    where m.user_id = v_uid and (p_circle is null or m.circle_id = p_circle)
  loop
    insert into public.messages (circle_id, user_id, kind, body, latitude, longitude)
    values (c.circle_id, v_uid, 'checkin', coalesce(v_name, 'Alguien') || ' llegó bien.', p_latitude, p_longitude);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;
  return v_count;
end;
$$;

-- SOS always reaches every circle of the sender, even if they paused sharing.
create or replace function public.send_sos(
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text;
  v_count integer := 0;
  c record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select display_name into v_name from public.profiles where id = v_uid;

  for c in select m.circle_id from public.circle_members m where m.user_id = v_uid loop
    insert into public.messages (circle_id, user_id, kind, body, latitude, longitude)
    values (c.circle_id, v_uid, 'sos', coalesce(v_name, 'Alguien') || ' necesita ayuda.', p_latitude, p_longitude);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;
  return v_count;
end;
$$;

create or replace function public.resolve_sos(p_circle uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.messages
     set resolved_at = now()
   where user_id = (select auth.uid())
     and kind = 'sos'
     and resolved_at is null
     and (p_circle is null or circle_id = p_circle);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Called by the device when it crosses a geofence. Duplicate transitions inside
-- two minutes are ignored (GPS jitter around the border).
create or replace function public.report_place_event(p_place uuid, p_kind text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_place public.places;
  v_name text;
  v_paused boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_kind not in ('arrive', 'leave') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;

  select * into v_place from public.places where id = p_place;
  if not found or not private.is_circle_member(v_place.circle_id) then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;

  -- Respect the privacy rules: no alerts if this member stopped sharing with the circle.
  if not exists (select 1 from public.circle_members
                  where circle_id = v_place.circle_id and user_id = v_uid and share_location) then
    return false;
  end if;
  select coalesce(s.sharing_paused_until > now(), false) into v_paused
    from public.user_settings s where s.user_id = v_uid;
  if coalesce(v_paused, false) then
    return false;
  end if;

  if exists (
    select 1 from public.messages
    where user_id = v_uid and place_id = p_place and kind = 'place'
      and body like case when p_kind = 'arrive' then '% llegó a %' else '% salió de %' end
      and created_at > now() - interval '2 minutes'
  ) then
    return false;
  end if;

  select display_name into v_name from public.profiles where id = v_uid;
  insert into public.messages (circle_id, user_id, kind, body, latitude, longitude, place_id)
  values (
    v_place.circle_id, v_uid, 'place',
    coalesce(v_name, 'Alguien')
      || case when p_kind = 'arrive' then ' llegó a ' else ' salió de ' end
      || v_place.name,
    v_place.latitude, v_place.longitude, v_place.id
  );
  return true;
end;
$$;

revoke all on function public.send_checkin(uuid, double precision, double precision) from public, anon;
revoke all on function public.send_sos(double precision, double precision) from public, anon;
revoke all on function public.resolve_sos(uuid) from public, anon;
revoke all on function public.report_place_event(uuid, text) from public, anon;
grant execute on function public.send_checkin(uuid, double precision, double precision) to authenticated;
grant execute on function public.send_sos(double precision, double precision) to authenticated;
grant execute on function public.resolve_sos(uuid) to authenticated;
grant execute on function public.report_place_event(uuid, text) to authenticated;

-- Push fan-out ------------------------------------------------------------------
-- Every feed entry notifies the other members of the circle through the Expo
-- push service. pg_net is asynchronous and failures never block the insert.

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net unavailable, push fan-out disabled: %', sqlerrm;
end;
$$;

create or replace function private.notify_circle_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender text;
  v_title text;
  v_payload jsonb;
begin
  begin
    select display_name into v_sender from public.profiles where id = new.user_id;
    v_sender := coalesce(v_sender, 'Alguien');
    v_title := case new.kind
      when 'sos' then 'SOS de ' || v_sender
      when 'checkin' then 'Llegué bien'
      when 'place' then 'Lugares'
      else v_sender
    end;

    select coalesce(jsonb_agg(jsonb_build_object(
             'to', t.token,
             'title', v_title,
             'body', case when new.kind = 'text' then left(new.body, 140) else new.body end,
             'sound', 'default',
             'priority', 'high',
             'channelId', case when new.kind = 'sos' then 'sos' else 'circle' end,
             'data', jsonb_build_object('circleId', new.circle_id, 'kind', new.kind)
           )), '[]'::jsonb)
      into v_payload
      from public.push_tokens t
      join public.circle_members m on m.user_id = t.user_id
     where m.circle_id = new.circle_id
       and t.user_id <> new.user_id;

    if jsonb_array_length(v_payload) > 0 then
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        body := v_payload,
        headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists trg_notify_circle_message on public.messages;
create trigger trg_notify_circle_message
  after insert on public.messages
  for each row execute function private.notify_circle_message();

-- Realtime ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['user_locations', 'messages', 'circle_members', 'places'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end;
$$;
