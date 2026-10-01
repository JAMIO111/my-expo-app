-- Squads (child teams) are a fixed combination of players.
--   * created by a member of the parent team, who invites other parent-team members
--   * pending until EVERY invited player accepts, then active
--   * if any invited player declines the squad is cancelled for everyone
--   * once set up the players cannot change and nobody can leave; the squad is only active or inactive
--   * if a member leaves the parent team, the squad goes inactive (its stats and history stay on
--     the same team row, so an identical squad is never re-created with a fresh record)
--   * the exact player combination is unique per parent team (enforced by a unique index)
-- Teams.status is now: pending | active | inactive | cancelled.

-- ── status values ───────────────────────────────────────────────────────────
alter table "Teams" drop constraint if exists teams_status_check;
update "Teams" set status = 'inactive' where status in ('archived', 'disbanded');
alter table "Teams" add constraint teams_status_check check (status in ('pending', 'active', 'inactive', 'cancelled'));

alter table "Teams" add column if not exists roster_key text;

-- ── cancelling a squad ──────────────────────────────────────────────────────
create or replace function public.cancel_child_team(p_team_id uuid, p_actor uuid, p_reason text default 'declined')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_team "Teams"%rowtype; v_actor_name text;
begin
  select * into v_team from "Teams" where id = p_team_id and parent_team_id is not null;
  if not found or v_team.status = 'cancelled' then return; end if;
  select trim(first_name || ' ' || surname) into v_actor_name from "Players" where id = p_actor;

  -- tell everyone involved before their rows are closed
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select tp.player_id,
         case when tp.status = 'active' then 'request_rejected' else 'invite_revoked' end,
         'Team cancelled',
         case
           when p_reason = 'declined' then coalesce(v_actor_name, 'A player') || ' declined, so ' || v_team.display_name || ' was cancelled.'
           else v_team.display_name || ' was cancelled because ' || coalesce(v_actor_name, 'a player') || ' left the team.' end,
         v_team.id, 'team', jsonb_build_object('team_id', v_team.id, 'team_name', v_team.display_name)
  from "TeamPlayers" tp
  where tp.team_id = p_team_id and tp.status in ('active', 'pending_player') and tp.player_id is distinct from p_actor;

  -- the invites they were sent are no longer valid
  delete from "Notifications" n
   using "TeamPlayers" tp
   where tp.team_id = p_team_id and n.player_id = tp.player_id and n.type = 'team_invite'
     and (n.data->>'team_id') = p_team_id::text;

  update "TeamPlayers"
     set status = case when player_id = p_actor and p_reason = 'declined' then 'rejected' else 'revoked' end,
         rejected_by = case when player_id = p_actor and p_reason = 'declined' then p_actor else rejected_by end,
         rejected_at = case when player_id = p_actor and p_reason = 'declined' then now() else rejected_at end,
         revoked_at = case when not (player_id = p_actor and p_reason = 'declined') then now() else revoked_at end
   where team_id = p_team_id and status in ('active', 'pending_player');

  update "Teams" set status = 'cancelled', updated_at = now() where id = p_team_id;
end $$;
revoke all on function public.cancel_child_team(uuid, uuid, text) from public, anon, authenticated;

-- ── create ──────────────────────────────────────────────────────────────────
create or replace function public.create_child_team(
  _creator_id uuid, _captain_id uuid, _name text, _parent_team_id uuid, _player_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_new_team_id uuid; v_player_id uuid; v_sorted uuid[]; v_key text; v_parent_name text;
begin
  if _creator_id is distinct from public.current_player_id() then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'You can only create a team as yourself.');
  end if;
  if coalesce(trim(_name), '') = '' then
    return jsonb_build_object('success', false, 'code', 'NAME_REQUIRED', 'message', 'Please give the team a name.');
  end if;
  if not (_creator_id = any(_player_ids)) then
    return jsonb_build_object('success', false, 'code', 'CREATOR_NOT_IN_TEAM', 'message', 'The creator must be one of the players in the team.');
  end if;
  if not (_captain_id = any(_player_ids)) then
    return jsonb_build_object('success', false, 'code', 'CAPTAIN_NOT_IN_TEAM', 'message', 'The captain must be one of the players in the team.');
  end if;
  if _captain_id != _creator_id then
    return jsonb_build_object('success', false, 'code', 'CAPTAIN_MUST_BE_CREATOR', 'message', 'The captain must initially be you.');
  end if;
  if coalesce(array_length(_player_ids, 1), 0) < 2 then
    return jsonb_build_object('success', false, 'code', 'INSUFFICIENT_PLAYERS', 'message', 'A team must have at least 2 players.');
  end if;
  if (select count(*) from unnest(_player_ids)) != (select count(distinct p) from unnest(_player_ids) p) then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PLAYERS', 'message', 'The player list contains duplicate entries.');
  end if;

  select display_name into v_parent_name from "Teams" where id = _parent_team_id and parent_team_id is null;
  if not found then
    return jsonb_build_object('success', false, 'code', 'PARENT_TEAM_NOT_FOUND', 'message', 'The parent team does not exist.');
  end if;

  -- everyone must be an active member of the parent team
  if exists (
    select 1 from unnest(_player_ids) p
    where not exists (select 1 from "TeamPlayers" tp where tp.team_id = _parent_team_id and tp.player_id = p and tp.status = 'active')
  ) then
    return jsonb_build_object('success', false, 'code', 'NOT_PARENT_MEMBERS', 'message', 'Every player must be an active member of the team.');
  end if;

  if exists (
    select 1 from "Teams" where parent_team_id = _parent_team_id and lower(name) = lower(trim(_name)) and status <> 'cancelled'
  ) then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_NAME', 'message', 'A team with this name already exists under the same parent team.');
  end if;

  select array_agg(p order by p) into v_sorted from unnest(_player_ids) p;
  v_key := array_to_string(v_sorted, ',');
  if exists (select 1 from "Teams" where parent_team_id = _parent_team_id and roster_key = v_key and status <> 'cancelled') then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PLAYER_COMBINATION',
      'message', 'A team with this exact player combination already exists. Reactivate it instead of creating a new one.');
  end if;

  insert into "Teams" (name, display_name, parent_team_id, status, roster_key, created_at)
  values (trim(_name), trim(_name), _parent_team_id, 'pending', v_key, now())
  returning id into v_new_team_id;

  foreach v_player_id in array _player_ids loop
    insert into "TeamPlayers" (team_id, player_id, role, status, joined_at, invited_at, invited_by)
    values (
      v_new_team_id, v_player_id,
      case when v_player_id = _captain_id then 'captain' else 'player' end,
      case when v_player_id = _creator_id then 'active' else 'pending_player' end,
      case when v_player_id = _creator_id then now() end,
      case when v_player_id <> _creator_id then now() end,
      case when v_player_id <> _creator_id then _creator_id end);
  end loop;

  insert into "Notifications" (player_id, type, title, message, data, role_id, created_at)
  select p, 'team_invite', 'Team Invitation',
         format('You have been invited to join %s, a team within %s. The team only goes ahead if everyone accepts.', trim(_name), v_parent_name),
         jsonb_build_object('team_id', v_new_team_id, 'team_name', trim(_name), 'parent_team_id', _parent_team_id, 'invited_by', _creator_id),
         pm.id, now()
  from unnest(_player_ids) p
  join "TeamPlayers" pm on pm.player_id = p and pm.team_id = _parent_team_id and pm.status = 'active'
  where p <> _creator_id;

  return jsonb_build_object('success', true, 'teamId', v_new_team_id);

exception
  when unique_violation then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PLAYER_COMBINATION',
      'message', 'A team with this exact player combination already exists. Reactivate it instead of creating a new one.');
  when others then
    return jsonb_build_object('success', false, 'code', 'UNEXPECTED_ERROR', 'message', sqlerrm);
end $$;

-- the exact combination is unique per parent team (cancelled squads do not count)
-- (created after the backfill below)

-- ── decline = cancel the whole squad ────────────────────────────────────────
create or replace function public.decline_child_team_invite(_invite_id uuid, _player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team_id uuid;
begin
  if _player_id is distinct from public.current_player_id() then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'You can only act for yourself.');
  end if;
  select tp.team_id into v_team_id
  from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
  where tp.id = _invite_id and tp.player_id = _player_id and tp.status = 'pending_player' and t.status = 'pending';
  if v_team_id is null then
    return jsonb_build_object('success', false, 'code', 'INVITE_NOT_FOUND', 'message', 'Invite not found or does not belong to this player.');
  end if;

  perform public.cancel_child_team(v_team_id, _player_id, 'declined');
  return jsonb_build_object('success', true, 'teamId', v_team_id, 'cancelled', true);
end $$;

-- ── nobody leaves a squad ───────────────────────────────────────────────────
create or replace function public.leave_child_team(_team_id uuid, _player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if _player_id is distinct from public.current_player_id() then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'You can only act for yourself.');
  end if;
  return jsonb_build_object('success', false, 'code', 'SQUAD_FIXED',
    'message', 'Players cannot leave a team once it is set up. The team can be set to inactive instead.');
end $$;

-- ── edit: name and captain only ─────────────────────────────────────────────
create or replace function public.update_child_team(
  _team_id uuid, _updater_id uuid, _name text, _captain_id uuid, _player_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_team "Teams"%rowtype; v_current uuid[]; v_new uuid[]; v_cur_captain uuid;
begin
  if _updater_id is distinct from public.current_player_id() then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'You can only update a team as yourself.');
  end if;
  select * into v_team from "Teams" where id = _team_id and parent_team_id is not null;
  if not found then
    return jsonb_build_object('success', false, 'code', 'TEAM_NOT_FOUND', 'message', 'The team does not exist.');
  end if;
  if v_team.status = 'cancelled' then
    return jsonb_build_object('success', false, 'code', 'TEAM_NOT_EDITABLE', 'message', 'This team was cancelled.');
  end if;

  select tp.player_id into v_cur_captain from "TeamPlayers" tp
   where tp.team_id = _team_id and tp.role = 'captain' and tp.status = 'active' limit 1;
  if _updater_id is distinct from v_cur_captain then
    return jsonb_build_object('success', false, 'code', 'UPDATER_NOT_CAPTAIN', 'message', 'Only the team captain can update the team.');
  end if;

  select array_agg(player_id order by player_id) into v_current
    from "TeamPlayers" where team_id = _team_id and status in ('active', 'pending_player');
  select array_agg(p order by p) into v_new from unnest(_player_ids) p;
  if v_current is distinct from v_new then
    return jsonb_build_object('success', false, 'code', 'ROSTER_LOCKED',
      'message', 'The players in a team cannot be changed once it is set up. Create a new team for a different combination.');
  end if;

  if coalesce(trim(_name), '') = '' then
    return jsonb_build_object('success', false, 'code', 'NAME_REQUIRED', 'message', 'Please give the team a name.');
  end if;
  if not exists (select 1 from "TeamPlayers" where team_id = _team_id and player_id = _captain_id and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'CAPTAIN_NOT_ACTIVE', 'message', 'The captain must be an active member of the team.');
  end if;
  if exists (select 1 from "Teams" where parent_team_id = v_team.parent_team_id and lower(name) = lower(trim(_name))
             and id <> _team_id and status <> 'cancelled') then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_NAME', 'message', 'A team with this name already exists under the same parent team.');
  end if;

  update "Teams" set name = trim(_name), display_name = trim(_name), updated_at = now() where id = _team_id;
  if _captain_id <> v_cur_captain then
    update "TeamPlayers" set role = 'player' where team_id = _team_id and player_id = v_cur_captain and status = 'active';
    update "TeamPlayers" set role = 'captain' where team_id = _team_id and player_id = _captain_id and status = 'active';
  end if;

  return jsonb_build_object('success', true, 'teamId', _team_id);
end $$;

-- ── active / inactive ───────────────────────────────────────────────────────
create or replace function public.set_child_team_active(p_team_id uuid, p_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_team "Teams"%rowtype;
begin
  select * into v_team from "Teams" where id = p_team_id and parent_team_id is not null;
  if not found then
    return jsonb_build_object('success', false, 'code', 'TEAM_NOT_FOUND', 'message', 'The team does not exist.');
  end if;
  if not (
    exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = v_me and role = 'captain' and status = 'active')
    or public.is_team_leader(v_team.parent_team_id)
    or public.is_district_admin((select district from "Teams" where id = v_team.parent_team_id))
  ) then
    raise exception 'Only the team captain, the club captains or a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_team.status not in ('active', 'inactive') then
    return jsonb_build_object('success', false, 'code', 'NOT_SWITCHABLE', 'message', 'A team can only be switched once every player has accepted.');
  end if;

  if p_active then
    if exists (
      select 1 from "TeamPlayers" tp
      where tp.team_id = p_team_id and tp.status = 'active'
        and not exists (select 1 from "TeamPlayers" pp where pp.team_id = v_team.parent_team_id and pp.player_id = tp.player_id and pp.status = 'active')
    ) then
      return jsonb_build_object('success', false, 'code', 'MEMBER_UNAVAILABLE',
        'message', 'A player in this team is no longer part of the club, so the team cannot be reactivated.');
    end if;
    update "Teams" set status = 'active', updated_at = now() where id = p_team_id;
  else
    if exists (
      select 1 from "CompetitionParticipants" cp join "CompetitionInstances" ci on ci.id = cp.competition_instance_id
      where cp.team_id = p_team_id and cp.status = 'active' and ci.status in ('active', 'upcoming')
    ) then
      return jsonb_build_object('success', false, 'code', 'IN_ACTIVE_COMPETITION',
        'message', 'This team is entered in a competition that has not finished.');
    end if;
    update "Teams" set status = 'inactive', updated_at = now() where id = p_team_id;
  end if;

  return jsonb_build_object('success', true, 'status', case when p_active then 'active' else 'inactive' end);
end $$;

-- ── a member leaves the club (or the account is deleted): the squad follows ──
create or replace function public.squads_on_member_leave()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record; v_parent uuid;
begin
  if new.status <> 'left' or old.status not in ('active', 'pending_player') then return new; end if;

  select parent_team_id into v_parent from "Teams" where id = new.team_id;

  for r in
    select c.id, c.status
    from "Teams" c
    where c.status in ('pending', 'active')
      and ( (v_parent is null and c.parent_team_id = new.team_id
             and exists (select 1 from "TeamPlayers" m where m.team_id = c.id and m.player_id = new.player_id and m.status in ('active', 'pending_player')))
         or (v_parent is not null and c.id = new.team_id) )
  loop
    if r.status = 'pending' then
      perform public.cancel_child_team(r.id, new.player_id, 'left');
    else
      update "Teams" set status = 'inactive', updated_at = now() where id = r.id;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.squads_on_member_leave() from public, anon, authenticated;

drop trigger if exists trg_squads_on_member_leave on "TeamPlayers";
create trigger trg_squads_on_member_leave after update of status on "TeamPlayers"
  for each row execute function public.squads_on_member_leave();

-- leaving the club no longer rewrites squad rosters
create or replace function public.leave_team(_player_id uuid, _team_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player_name text; v_team_name text;
begin
  if _player_id is distinct from public.current_player_id() then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'message', 'You can only leave a team for yourself.');
  end if;
  if not exists (select 1 from "TeamPlayers" where team_id = _team_id and player_id = _player_id and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'PLAYER_NOT_IN_TEAM', 'message', 'You are not an active member of this team.');
  end if;
  if not exists (select 1 from "Teams" where id = _team_id and parent_team_id is null) then
    return jsonb_build_object('success', false, 'code', 'NOT_A_PARENT_TEAM', 'message', 'This team is not a parent team.');
  end if;
  if exists (select 1 from "TeamPlayers" where team_id = _team_id and player_id = _player_id and role = 'captain' and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'CAPTAIN_CANNOT_LEAVE',
      'message', 'You cannot leave the team while you are the captain. Please assign a new captain first.');
  end if;

  select trim(first_name || ' ' || surname) into v_player_name from "Players" where id = _player_id;
  select display_name into v_team_name from "Teams" where id = _team_id;

  -- the squad trigger sets any of this player's squads inactive (or cancels pending ones)
  update "TeamPlayers" set status = 'left', left_at = now()
   where team_id = _team_id and player_id = _player_id and status = 'active';

  insert into "Notifications" (player_id, type, title, message, data, created_at)
  select tp.player_id, 'player_left', 'Player Left', format('%s has left %s', v_player_name, v_team_name),
         jsonb_build_object('team_id', _team_id, 'team_name', v_team_name, 'player_id', _player_id), now()
  from "TeamPlayers" tp where tp.team_id = _team_id and tp.player_id <> _player_id and tp.status = 'active';

  return jsonb_build_object('success', true, 'teamId', _team_id);
exception when others then
  return jsonb_build_object('success', false, 'code', 'UNEXPECTED_ERROR', 'message', sqlerrm);
end $$;

-- only active teams can be entered into competitions
do $patch$
declare v_def text := pg_get_functiondef('public.join_competition(uuid,uuid,uuid)'::regprocedure); v_new text;
begin
  v_new := regexp_replace(v_def, '-- Duplicate check',
    E'if not exists (select 1 from "Teams" where id = p_team_id and status = ''active'') then\n      raise exception ''TEAM_NOT_ACTIVE'';\n    end if;\n\n    -- Duplicate check');
  if v_new = v_def then raise exception 'join_competition patch failed'; end if;
  execute v_new;
end
$patch$;

-- transfers: inactive / cancelled teams cannot take players
create or replace function public.transfer_block_reason(p_team_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_district uuid; v_window boolean; v_div uuid; v_mid boolean; v_status text;
begin
  select district, status into v_district, v_status from "Teams" where id = p_team_id;
  if v_district is null then return 'team_not_found'; end if;

  v_div := public.team_division_id(p_team_id);
  if v_div is null or v_status = 'pending' then return 'team_not_approved'; end if;
  if v_status in ('inactive', 'cancelled') then return 'team_inactive'; end if;

  select transfer_window_open into v_window from "Districts" where id = v_district;
  if v_window is not true then return 'window_closed'; end if;

  select mid_season_transfers into v_mid from "Divisions" where id = v_div;
  if v_mid is not true
     and exists (select 1 from "Seasons" where district = v_district and status = 'active') then
    return 'mid_season_transfers_off';
  end if;
  return null;
end $$;

-- ── clean up existing squads to match the rules ─────────────────────────────
-- pending squads with no active captain can never complete: cancel them
do $$
declare r record;
begin
  for r in
    select t.id from "Teams" t
    where t.parent_team_id is not null and t.status = 'pending'
      and not exists (select 1 from "TeamPlayers" tp where tp.team_id = t.id and tp.role = 'captain' and tp.status = 'active')
  loop
    perform public.cancel_child_team(r.id, null, 'left');
  end loop;
end $$;

-- active squads that lost a member are inactive
update "Teams" t set status = 'inactive'
 where t.parent_team_id is not null and t.status = 'active'
   and (select count(*) from "TeamPlayers" tp where tp.team_id = t.id and tp.status = 'active') < 2;

-- roster keys for every squad that is still in play
update "Teams" t
   set roster_key = (select array_to_string(array_agg(tp.player_id order by tp.player_id), ',')
                       from "TeamPlayers" tp where tp.team_id = t.id and tp.status in ('active', 'pending_player'))
 where t.parent_team_id is not null and t.status in ('pending', 'active', 'inactive');

create unique index if not exists teams_unique_squad_roster
  on "Teams" (parent_team_id, roster_key)
  where parent_team_id is not null and roster_key is not null and status <> 'cancelled';

-- privileges
revoke all on function public.set_child_team_active(uuid, boolean), public.create_child_team(uuid, uuid, text, uuid, uuid[]),
  public.decline_child_team_invite(uuid, uuid), public.leave_child_team(uuid, uuid),
  public.update_child_team(uuid, uuid, text, uuid, uuid[]), public.leave_team(uuid, uuid) from public, anon;
grant execute on function public.set_child_team_active(uuid, boolean), public.create_child_team(uuid, uuid, text, uuid, uuid[]),
  public.decline_child_team_invite(uuid, uuid), public.leave_child_team(uuid, uuid),
  public.update_child_team(uuid, uuid, text, uuid, uuid[]), public.leave_team(uuid, uuid) to authenticated;
