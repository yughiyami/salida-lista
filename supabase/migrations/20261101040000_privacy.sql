-- Phase 7: data export, account deletion and retention.

-- Everything the service stores about the caller, as one JSON document.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'settings', (select to_jsonb(s) from public.user_settings s where s.user_id = v_uid),
    'circles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'circle_id', m.circle_id, 'name', c.name, 'role', m.role,
        'share_location', m.share_location, 'joined_at', m.joined_at))
      from public.circle_members m join public.circles c on c.id = m.circle_id
      where m.user_id = v_uid), '[]'::jsonb),
    'live_location', (select to_jsonb(l) from public.user_locations l where l.user_id = v_uid),
    'location_history', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.recorded_at desc)
      from public.location_history h where h.user_id = v_uid), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(to_jsonb(msg) order by msg.created_at desc)
      from public.messages msg where msg.user_id = v_uid), '[]'::jsonb),
    'places_created', coalesce((
      select jsonb_agg(to_jsonb(pl)) from public.places pl where pl.created_by = v_uid), '[]'::jsonb)
  );
end;
$$;

-- Removes the auth user; foreign keys cascade to profile, settings, positions,
-- history, messages, tokens and memberships. Circles with other members are
-- handed to the oldest remaining member first.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform private.release_owned_circles(v_uid);
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.export_my_data() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Retention: location history 30 days, circle feed 90 days, join attempts 1 day.
create or replace function private.purge_expired_data()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.location_history where recorded_at < now() - interval '30 days';
  delete from public.messages where created_at < now() - interval '90 days';
  delete from public.circle_join_attempts where attempted_at < now() - interval '1 day';
$$;

revoke all on function private.purge_expired_data() from public, anon, authenticated;

-- Schedule the purge hourly when pg_cron is available (enable it in the
-- Supabase dashboard under Database > Extensions). Otherwise run the function manually.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge-expired-data')
      where exists (select 1 from cron.job where jobname = 'purge-expired-data');
    perform cron.schedule('purge-expired-data', '17 * * * *', 'select private.purge_expired_data()');
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end;
$$;
