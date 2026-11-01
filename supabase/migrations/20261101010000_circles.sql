-- Phase 2: circles, memberships, invite codes and visibility rules.
-- Clients never write circles/circle_members directly: every change goes through
-- a security-definer RPC so membership rules live in one place.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  share_location boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index if not exists circle_members_user_idx on public.circle_members (user_id);

create table if not exists public.circle_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists circle_join_attempts_user_idx
  on public.circle_join_attempts (user_id, attempted_at desc);

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_join_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (private schema, not exposed through the REST API)
-- ---------------------------------------------------------------------------

create or replace function private.is_circle_member(p_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members m
    where m.circle_id = p_circle
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.shares_circle_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members mine
    join public.circle_members theirs on theirs.circle_id = mine.circle_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user
  );
$$;

create or replace function private.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  candidate text;
  i int;
begin
  loop
    bytes := extensions.gen_random_bytes(8);
    candidate := '';
    for i in 0..7 loop
      candidate := candidate || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.circles where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Ownership hand-over used by leave_circle and account deletion: the oldest
-- remaining member inherits the circle, or the circle disappears when empty.
create or replace function private.release_owned_circles(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  heir uuid;
begin
  for c in select id from public.circles where owner_id = p_user loop
    select m.user_id into heir
    from public.circle_members m
    where m.circle_id = c.id and m.user_id <> p_user
    order by m.joined_at asc
    limit 1;

    if heir is null then
      delete from public.circles where id = c.id;
    else
      update public.circles set owner_id = heir where id = c.id;
      update public.circle_members set role = 'owner'
        where circle_id = c.id and user_id = heir;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security: read-only for clients
-- ---------------------------------------------------------------------------

drop policy if exists circles_select_member on public.circles;
create policy circles_select_member on public.circles
  for select to authenticated
  using (private.is_circle_member(id));

drop policy if exists circle_members_select_member on public.circle_members;
create policy circle_members_select_member on public.circle_members
  for select to authenticated
  using (private.is_circle_member(circle_id));

-- Members can read the profile of anybody who shares a circle with them.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_own_or_circle on public.profiles;
create policy profiles_select_own_or_circle on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or private.shares_circle_with(id));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_circle(p_name text)
returns public.circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_circle public.circles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if char_length(v_name) not between 2 and 40 then
    raise exception 'invalid_circle_name' using errcode = '22023';
  end if;
  if (select count(*) from public.circles where owner_id = v_uid) >= 5 then
    raise exception 'circle_limit_reached' using errcode = '53400';
  end if;

  insert into public.circles (name, owner_id, invite_code)
  values (v_name, v_uid, private.generate_invite_code())
  returning * into v_circle;

  insert into public.circle_members (circle_id, user_id, role)
  values (v_circle.id, v_uid, 'owner');

  return v_circle;
end;
$$;

create or replace function public.join_circle(p_code text)
returns public.circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_circle public.circles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if (select count(*) from public.circle_join_attempts
        where user_id = v_uid and attempted_at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_attempts' using errcode = '53400';
  end if;

  select * into v_circle from public.circles where invite_code = v_code;
  if not found then
    -- Return instead of raising: an exception would roll back the attempt row
    -- and the rate limit above would never trigger. The client maps a null id
    -- to "invalid code".
    insert into public.circle_join_attempts (user_id) values (v_uid);
    return null;
  end if;

  if (select count(*) from public.circle_members where circle_id = v_circle.id) >= 20
     and not exists (select 1 from public.circle_members
                      where circle_id = v_circle.id and user_id = v_uid) then
    raise exception 'circle_full' using errcode = '53400';
  end if;

  insert into public.circle_members (circle_id, user_id, role)
  values (v_circle.id, v_uid, 'member')
  on conflict (circle_id, user_id) do nothing;

  return v_circle;
end;
$$;

create or replace function public.leave_circle(p_circle uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
begin
  select owner_id into v_owner from public.circles where id = p_circle;
  if v_owner is null or not private.is_circle_member(p_circle) then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;

  if v_owner = v_uid then
    perform private.release_owned_circles(v_uid);
  end if;

  delete from public.circle_members where circle_id = p_circle and user_id = v_uid;
end;
$$;

create or replace function public.rotate_invite_code(p_circle uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if not exists (select 1 from public.circles
                  where id = p_circle and owner_id = (select auth.uid())) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  v_code := private.generate_invite_code();
  update public.circles set invite_code = v_code where id = p_circle;
  return v_code;
end;
$$;

create or replace function public.remove_circle_member(p_circle uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.circles
                  where id = p_circle and owner_id = (select auth.uid())) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'use_leave_circle' using errcode = '22023';
  end if;
  delete from public.circle_members where circle_id = p_circle and user_id = p_user;
end;
$$;

create or replace function public.set_circle_sharing(p_circle uuid, p_share boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.circle_members
     set share_location = p_share
   where circle_id = p_circle and user_id = (select auth.uid());
  if not found then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;
end;
$$;

-- Lock the RPCs down to signed-in users only.
revoke all on function public.create_circle(text) from public, anon;
revoke all on function public.join_circle(text) from public, anon;
revoke all on function public.leave_circle(uuid) from public, anon;
revoke all on function public.rotate_invite_code(uuid) from public, anon;
revoke all on function public.remove_circle_member(uuid, uuid) from public, anon;
revoke all on function public.set_circle_sharing(uuid, boolean) from public, anon;
grant execute on function public.create_circle(text) to authenticated;
grant execute on function public.join_circle(text) to authenticated;
grant execute on function public.leave_circle(uuid) to authenticated;
grant execute on function public.rotate_invite_code(uuid) to authenticated;
grant execute on function public.remove_circle_member(uuid, uuid) to authenticated;
grant execute on function public.set_circle_sharing(uuid, boolean) to authenticated;

revoke all on function private.is_circle_member(uuid) from public, anon;
revoke all on function private.shares_circle_with(uuid) from public, anon;
revoke all on function private.generate_invite_code() from public, anon, authenticated;
revoke all on function private.release_owned_circles(uuid) from public, anon, authenticated;
grant execute on function private.is_circle_member(uuid) to authenticated;
grant execute on function private.shares_circle_with(uuid) to authenticated;
