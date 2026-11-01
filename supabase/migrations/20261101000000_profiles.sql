-- Migración Fase 1: Tabla de perfiles de usuario (public.profiles) con RLS y triggers

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Política: cada usuario lee solo su propio perfil (en Fase 2 se ampliará a miembros de su círculo)
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Política: cada usuario inserta su propio perfil (necesario para upsert en onboarding tras OTP)
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Política: cada usuario actualiza solo su propio perfil
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger para mantener updated_at actualizado automáticamente
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Trigger handle_new_user al registrarse en auth.users:
-- Si el registro incluye un display_name válido (2..40 caracteres) en raw_user_meta_data,
-- crea la fila automáticamente. En login por OTP sin nombre inicial, el usuario completa
-- su perfil en la pantalla de onboarding (upsert en public.profiles).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_avatar_url text;
begin
  v_display_name := btrim(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''));
  v_avatar_url := nullif(btrim(coalesce(new.raw_user_meta_data->>'avatar_url', '')), '');

  if char_length(v_display_name) between 2 and 40 then
    insert into public.profiles (id, display_name, avatar_url)
    values (new.id, v_display_name, v_avatar_url)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

