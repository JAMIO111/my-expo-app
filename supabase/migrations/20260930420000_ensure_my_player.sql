-- An account can end up signed in with no Players row (created before the sign-up trigger existed, a
-- restore, a manual delete). The app then had nothing to show. This heals it: it creates the missing row
-- for the signed-in account, and does nothing if one already exists.
create or replace function public.ensure_my_player()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_row "Players"%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;

  select * into v_row from "Players" where auth_id = v_uid limit 1;
  if found then
    return jsonb_build_object('created', false, 'deleted', coalesce(v_row.is_deleted, false), 'player_id', v_row.id);
  end if;

  insert into "Players" (auth_id, onboarding) values (v_uid, 0) returning * into v_row;
  return jsonb_build_object('created', true, 'deleted', false, 'player_id', v_row.id);
end $$;
revoke all on function public.ensure_my_player() from public, anon;
grant execute on function public.ensure_my_player() to authenticated;
