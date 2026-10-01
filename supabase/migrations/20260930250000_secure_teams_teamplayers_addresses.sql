-- Teams, TeamPlayers, Addresses and CompetitionParticipants had "using (true)" write
-- policies, so any signed-in user could edit any team, put themselves on any roster
-- (as captain) or rewrite any venue. Every legitimate change already goes through a
-- checked SECURITY DEFINER function; the remaining direct client writes move into the
-- functions below, then the open policies are removed.

create or replace function public.is_team_leader(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from "TeamPlayers" tp
    where tp.team_id = p_team_id
      and tp.player_id = public.current_player_id()
      and tp.role in ('captain', 'vice_captain')
      and tp.status = 'active')
$$;

create or replace function public.can_manage_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as
$$
  select public.is_team_leader(p_team_id)
      or public.is_district_admin((select district from "Teams" where id = p_team_id))
$$;

grant execute on function public.is_team_leader(uuid), public.can_manage_team(uuid) to authenticated;

create or replace function public.update_team_crest(p_team_id uuid, p_crest jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then
    raise exception 'Only the team captain, vice captain or a league admin can do this'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  update "Teams" set crest = p_crest, updated_at = now() where id = p_team_id;
end $$;

create or replace function public.update_team_cover_image(p_team_id uuid, p_cover_image_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then
    raise exception 'Only the team captain, vice captain or a league admin can do this'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  update "Teams" set cover_image_url = p_cover_image_url, updated_at = now() where id = p_team_id;
end $$;

create or replace function public.set_team_address(p_team_id uuid, p_address_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_team_district uuid; v_address_district uuid;
begin
  if not public.can_manage_team(p_team_id) then
    raise exception 'Only the team captain, vice captain or a league admin can do this'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_address_id is not null then
    select district into v_team_district from "Teams" where id = p_team_id;
    select district_id into v_address_district from "Addresses" where id = p_address_id;
    if not found then
      raise exception 'Venue not found' using detail = 'venue_not_found';
    end if;
    if v_address_district is not null and v_address_district is distinct from v_team_district then
      raise exception 'That venue belongs to another league' using errcode = '42501', detail = 'not_authorised';
    end if;
  end if;
  update "Teams" set address = p_address_id, updated_at = now() where id = p_team_id;
end $$;

create or replace function public.remove_team_from_division(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_district_admin((select district from "Teams" where id = p_team_id)) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  update "Teams" set division = null, updated_at = now() where id = p_team_id;
end $$;

-- The invited player declines an invite sent to them.
create or replace function public.decline_player_join_team_invite(p_team_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.current_player_id(); v_tp "TeamPlayers"%rowtype;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Player not found');
  end if;
  select * into v_tp from "TeamPlayers" where id = p_team_player_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Invite not found');
  end if;
  if v_tp.player_id <> v_me or v_tp.invited_by is null then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'message', 'You can only decline an invite sent to you');
  end if;
  if v_tp.status not in ('invited', 'pending_player', 'pending_admin', 'pending_both') then
    return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This invite is no longer pending');
  end if;
  update "TeamPlayers" set status = 'rejected', rejected_by = v_me, rejected_at = now()
  where id = p_team_player_id;
  return jsonb_build_object('success', true);
end $$;

-- ── authorisation for existing definer functions that trusted their arguments ──
create or replace function public.can_manage_address(p_address_id uuid, p_district_id uuid, p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as
$$
  select case
    when p_address_id is not null then
      public.is_district_admin((select district_id from "Addresses" where id = p_address_id))
      or exists (select 1 from "Teams" t where t.address = p_address_id and public.is_team_leader(t.id))
    else
      public.is_district_admin(p_district_id)
      or (p_team_id is not null and public.is_team_leader(p_team_id))
  end
$$;
grant execute on function public.can_manage_address(uuid, uuid, uuid) to authenticated;

create or replace function public.delete_address(p_address_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_address(p_address_id, null, null) then
    raise exception 'You cannot delete this venue' using errcode = '42501', detail = 'not_authorised';
  end if;
  update "Teams" set address = null where address = p_address_id;
  delete from "Addresses" where id = p_address_id;
end $$;

do $patch$
declare v_def text; v_new text;
begin
  -- upsert_address: only league admins, or leaders of the team that owns / is getting the venue
  v_def := pg_get_functiondef('public.upsert_address(uuid,text,text,text,text,text,text,integer,boolean,uuid,uuid)'::regprocedure);
  v_new := regexp_replace(v_def, '\ybegin\y',
    E'begin\n    if not public.can_manage_address(p_address_id, p_district_id, p_team_id) then\n        raise exception ''You cannot change this venue'' using errcode = ''42501'', detail = ''not_authorised'';\n    end if;\n', 'i');
  if v_new = v_def then raise exception 'upsert_address patch failed'; end if;
  execute v_new;

  -- leave_team: a player can only leave for themselves
  v_def := pg_get_functiondef('public.leave_team(uuid,uuid)'::regprocedure);
  v_new := regexp_replace(v_def, '\yBEGIN\y',
    E'BEGIN\n  IF _player_id IS DISTINCT FROM public.current_player_id() THEN\n    RETURN jsonb_build_object(''success'', false, ''code'', ''forbidden'', ''message'', ''You can only leave a team for yourself.'');\n  END IF;\n', 'i');
  if v_new = v_def then raise exception 'leave_team patch failed'; end if;
  execute v_new;
end
$patch$;

-- Superseded by accept_/decline_player_join_team_request (which check the caller);
-- this one trusted the admin/captain ids passed in by the client.
drop function if exists public.handle_player_join_team_request(uuid, text, uuid, uuid);

-- ── policies ────────────────────────────────────────────────────────────────
drop policy if exists "Authenticated write access" on "Teams";
drop policy if exists "Authenticated write access" on "TeamPlayers";
drop policy if exists "Authenticated write access" on "Addresses";
drop policy if exists "Authenticated write access" on "CompetitionParticipants";

create policy "District admins write" on "CompetitionParticipants" for all to authenticated
  using (public.is_district_admin(public.competition_instance_district(competition_instance_id)))
  with check (public.is_district_admin(public.competition_instance_district(competition_instance_id)));

revoke insert, update, delete on "Teams", "TeamPlayers", "Addresses" from anon, authenticated;
revoke insert, update, delete on "CompetitionParticipants" from anon;

revoke all on function public.update_team_crest(uuid, jsonb), public.update_team_cover_image(uuid, text),
  public.set_team_address(uuid, uuid), public.remove_team_from_division(uuid),
  public.decline_player_join_team_invite(uuid), public.delete_address(uuid) from public, anon;
grant execute on function public.update_team_crest(uuid, jsonb), public.update_team_cover_image(uuid, text),
  public.set_team_address(uuid, uuid), public.remove_team_from_division(uuid),
  public.decline_player_join_team_invite(uuid), public.delete_address(uuid) to authenticated;
