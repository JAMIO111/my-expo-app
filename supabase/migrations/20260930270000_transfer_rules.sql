-- Transfer rules, enforced in the database:
--  * transfer window (Districts.transfer_window_open) must be open
--  * a division with mid_season_transfers = false does not allow joins while a season is active
--  * team approval when Teams.private is on
--  * admin approval when Districts.transfer_approval_required or Divisions.admin_approval_required
--  * captains AND vice captains act for their team; any admin of the team's district acts as admin
--  * one active team per district unless the district allows multi-team membership
-- Also adds invite_player_to_team (invites could not be created before), makes onboarding joins
-- derive their approvals on the server instead of trusting the client, and lists who each
-- pending request/invite is waiting on.

-- ── helpers ─────────────────────────────────────────────────────────────────
create or replace function public.team_division_id(p_team_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select dm.division_id from "DivisionMembers" dm
      where dm.team_id = p_team_id and dm.member_type = 'team' and dm.status = 'active' limit 1),
    (select division from "Teams" where id = p_team_id))
$$;

create or replace function public.transfer_block_reason(p_team_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_district uuid; v_window boolean; v_div uuid; v_mid boolean;
begin
  select district into v_district from "Teams" where id = p_team_id;
  if v_district is null then return 'team_not_found'; end if;

  select transfer_window_open into v_window from "Districts" where id = v_district;
  if v_window is not true then return 'window_closed'; end if;

  v_div := public.team_division_id(p_team_id);
  if v_div is not null then
    select mid_season_transfers into v_mid from "Divisions" where id = v_div;
    if v_mid is not true
       and exists (select 1 from "Seasons" where district = v_district and status = 'active') then
      return 'mid_season_transfers_off';
    end if;
  end if;
  return null;
end $$;

create or replace function public.transfer_block_response(p_team_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when r is null then null
    else jsonb_build_object(
      'success', false, 'code', r, 'title', 'Transfers unavailable',
      'message', case r
        when 'window_closed' then 'The transfer window is currently closed for this league.'
        when 'mid_season_transfers_off' then 'Mid-season transfers are not allowed in this division. Transfers reopen when the season ends.'
        else 'This team cannot accept transfers right now.' end)
  end
  from (select public.transfer_block_reason(p_team_id) as r) x
$$;

create or replace function public.transfer_approvals(p_team_id uuid)
returns table(need_team boolean, need_admin boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(t.private, false),
         coalesce(d.transfer_approval_required, false) or coalesce(dv.admin_approval_required, false)
  from "Teams" t
  left join "Districts" d on d.id = t.district
  left join "Divisions" dv on dv.id = public.team_division_id(t.id)
  where t.id = p_team_id
$$;

create or replace function public.player_district_conflict(p_team_id uuid, p_player_id uuid, p_exclude uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(d.allow_multi_team_membership, false) is false
     and exists (
       select 1 from "TeamPlayers" tp
       join "Teams" t on t.id = tp.team_id
       where tp.player_id = p_player_id
         and tp.status = 'active'
         and t.district = tm.district
         and t.parent_team_id is null
         and tp.team_id <> p_team_id
         and tp.id is distinct from p_exclude)
  from "Teams" tm
  left join "Districts" d on d.id = tm.district
  where tm.id = p_team_id
$$;

revoke all on function public.team_division_id(uuid), public.transfer_block_reason(uuid),
  public.transfer_block_response(uuid), public.transfer_approvals(uuid),
  public.player_district_conflict(uuid, uuid, uuid) from public, anon;
grant execute on function public.team_division_id(uuid), public.transfer_block_reason(uuid),
  public.transfer_block_response(uuid), public.transfer_approvals(uuid),
  public.player_district_conflict(uuid, uuid, uuid) to authenticated;

-- a player can only have one live row per team
create unique index if not exists teamplayers_one_live_row
  on "TeamPlayers" (team_id, player_id)
  where status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both', 'active');

-- stamp the active season on whoever becomes active
create or replace function public.set_team_player_season()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and new.season_id is null then
    select s.id into new.season_id
    from "Seasons" s
    join "Teams" t on t.district = s.district
    where t.id = new.team_id and s.status = 'active'
    limit 1;
  end if;
  if new.status = 'active' and new.joined_at is null then
    new.joined_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_set_team_player_season on "TeamPlayers";
create trigger trg_set_team_player_season before insert or update of status on "TeamPlayers"
  for each row execute function public.set_team_player_season();

-- ── notifications for a new request / invite ────────────────────────────────
create or replace function public.notify_team_join_request(p_tp_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_tp "TeamPlayers"%rowtype; v_team "Teams"%rowtype; v_name text; v_is_invite boolean;
begin
  select * into v_tp from "TeamPlayers" where id = p_tp_id;
  if not found then return; end if;
  select * into v_team from "Teams" where id = v_tp.team_id;
  select trim(first_name || ' ' || surname) into v_name from "Players" where id = v_tp.player_id;
  v_is_invite := v_tp.invited_by is not null;

  if v_is_invite then
    if v_tp.status in ('invited', 'pending_player', 'pending_both') then
      insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
      values (v_tp.player_id, 'team_invite', 'Team invite',
              'You have been invited to join ' || v_team.display_name,
              v_tp.id, 'team_player', jsonb_build_object('teamId', v_team.id, 'kind', 'invite'));
    end if;
  elsif v_tp.status in ('requested', 'pending_captain', 'pending_both') then
    insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
    select tp.player_id, 'team_invite', 'New join request',
           v_name || ' has requested to join ' || v_team.display_name,
           v_tp.id, 'team_player', jsonb_build_object('teamId', v_team.id, 'requestingPlayerId', v_tp.player_id, 'kind', 'request')
    from "TeamPlayers" tp
    where tp.team_id = v_team.id and tp.role in ('captain', 'vice_captain') and tp.status = 'active';
  end if;

  if v_tp.status in ('pending_admin', 'pending_both') then
    insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
    select da.user_id, 'team_invite', 'Transfer awaiting approval',
           case when v_is_invite
             then v_name || ' has been invited to join ' || v_team.display_name
             else v_name || ' has requested to join ' || v_team.display_name end,
           v_tp.id, 'team_player', jsonb_build_object('teamId', v_team.id, 'playerId', v_tp.player_id, 'kind', 'admin_approval')
    from "DistrictAdmins" da where da.district_id = v_team.district;
  end if;
end $$;
revoke all on function public.notify_team_join_request(uuid) from public, anon, authenticated;

-- ── a player asks to join a team ────────────────────────────────────────────
create or replace function public.request_player_join_team(p_team_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_team "Teams"%rowtype;
  v_block jsonb;
  v_need_team boolean; v_need_admin boolean;
  v_status text;
  v_row "TeamPlayers"%rowtype;
  v_name text;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'title', 'Failed to send request', 'message', 'Player not found');
  end if;

  select * into v_team from "Teams" where id = p_team_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'title', 'Failed to send request', 'message', 'Team not found');
  end if;
  if v_team.parent_team_id is not null then
    return jsonb_build_object('success', false, 'code', 'not_a_parent_team', 'title', 'Failed to send request', 'message', 'You can only request to join a main team');
  end if;

  v_block := public.transfer_block_response(p_team_id);
  if v_block is not null then return v_block; end if;

  if exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = v_me and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'already_member', 'title', 'Failed to send request', 'message', 'You are already an active member of this team');
  end if;
  if exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = v_me
             and status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both')) then
    return jsonb_build_object('success', false, 'code', 'already_pending', 'title', 'Failed to send request', 'message', 'You already have a pending request or invite for this team');
  end if;
  if public.player_district_conflict(p_team_id, v_me) then
    return jsonb_build_object('success', false, 'code', 'already_in_district', 'title', 'Failed to send request', 'message', 'You are already an active player on another team in this league. Leave that team first');
  end if;

  select a.need_team, a.need_admin into v_need_team, v_need_admin from public.transfer_approvals(p_team_id) a;
  v_status := case
    when v_need_team and v_need_admin then 'pending_both'
    when v_need_team then 'pending_captain'
    when v_need_admin then 'pending_admin'
    else 'active' end;

  insert into "TeamPlayers" (team_id, player_id, status, requested_by, requested_at, role, joined_at)
  values (p_team_id, v_me, v_status, v_me, now(), 'player', case when v_status = 'active' then now() end)
  returning * into v_row;

  if v_status = 'active' then
    select trim(first_name || ' ' || surname) into v_name from "Players" where id = v_me;
    insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
    select tp.player_id, 'player_joined', 'New team member', v_name || ' has joined ' || v_team.display_name,
           p_team_id, 'team', jsonb_build_object('teamId', p_team_id, 'playerId', v_me)
    from "TeamPlayers" tp where tp.team_id = p_team_id and tp.status = 'active' and tp.player_id <> v_me;
  else
    perform public.notify_team_join_request(v_row.id);
  end if;

  return jsonb_build_object('success', true, 'status', v_status, 'teamPlayer', to_jsonb(v_row));
end $$;

-- ── a captain / vice captain / admin invites a player ───────────────────────
create or replace function public.invite_player_to_team(p_team_id uuid, p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_team "Teams"%rowtype;
  v_is_admin boolean; v_is_leader boolean;
  v_block jsonb;
  v_need_admin boolean;
  v_status text;
  v_row "TeamPlayers"%rowtype;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'title', 'Failed to invite player', 'message', 'Player not found');
  end if;
  select * into v_team from "Teams" where id = p_team_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'title', 'Failed to invite player', 'message', 'Team not found');
  end if;
  v_is_leader := public.is_team_leader(p_team_id);
  v_is_admin := public.is_district_admin(v_team.district);
  if not v_is_leader and not v_is_admin then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'title', 'Failed to invite player', 'message', 'Only the captain, vice captain or a league admin can invite players');
  end if;
  if v_team.parent_team_id is not null then
    return jsonb_build_object('success', false, 'code', 'not_a_parent_team', 'title', 'Failed to invite player', 'message', 'You can only invite players to a main team');
  end if;
  if not exists (select 1 from "Players" where id = p_player_id and coalesce(is_deleted, false) = false) then
    return jsonb_build_object('success', false, 'code', 'player_not_found', 'title', 'Failed to invite player', 'message', 'That player could not be found');
  end if;

  v_block := public.transfer_block_response(p_team_id);
  if v_block is not null then return v_block; end if;

  if exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = p_player_id and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'already_member', 'title', 'Failed to invite player', 'message', 'That player is already on this team');
  end if;
  if exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = p_player_id
             and status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both')) then
    return jsonb_build_object('success', false, 'code', 'already_pending', 'title', 'Failed to invite player', 'message', 'That player already has a pending request or invite for this team');
  end if;
  if public.player_district_conflict(p_team_id, p_player_id) then
    return jsonb_build_object('success', false, 'code', 'already_in_district', 'title', 'Failed to invite player', 'message', 'That player is already active on another team in this league');
  end if;

  select a.need_admin into v_need_admin from public.transfer_approvals(p_team_id) a;
  -- an admin issuing the invite supplies the admin approval themselves
  v_status := case when v_need_admin and not v_is_admin then 'pending_both' else 'pending_player' end;

  insert into "TeamPlayers" (team_id, player_id, status, role, invited_by, invited_at,
                             accepted_by_admin, accepted_at_admin)
  values (p_team_id, p_player_id, v_status, 'player', v_me, now(),
          case when v_is_admin and v_need_admin then v_me end,
          case when v_is_admin and v_need_admin then now() end)
  returning * into v_row;

  perform public.notify_team_join_request(v_row.id);
  return jsonb_build_object('success', true, 'status', v_status, 'teamPlayer', to_jsonb(v_row));
end $$;

-- ── onboarding join: approvals come from the rules, not the client ──────────
drop function if exists public.request_join_team_onboarding(uuid, uuid, boolean, boolean);

create function public.request_join_team_onboarding(
  p_team_id uuid, p_player_id uuid, p_captain_approval boolean default null, p_admin_approval boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_team "Teams"%rowtype; v_need_team boolean; v_need_admin boolean; v_status text; v_row "TeamPlayers"%rowtype;
begin
  -- p_captain_approval / p_admin_approval are ignored: kept so older app builds still call this
  if p_player_id is distinct from public.current_player_id() then
    raise exception 'You can only join a team for yourself' using errcode = '42501', detail = 'not_authorised';
  end if;
  select * into v_team from "Teams" where id = p_team_id;
  if not found or v_team.parent_team_id is not null then
    raise exception 'TEAM_NOT_FOUND';
  end if;
  if exists (select 1 from "TeamPlayers" where team_id = p_team_id and player_id = p_player_id
             and status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both', 'active')) then
    raise exception 'ALREADY_IN_TEAM';
  end if;
  if public.player_district_conflict(p_team_id, p_player_id) then
    raise exception 'ALREADY_IN_DISTRICT';
  end if;

  select a.need_team, a.need_admin into v_need_team, v_need_admin from public.transfer_approvals(p_team_id) a;
  v_status := case
    when v_need_team and v_need_admin then 'pending_both'
    when v_need_team then 'pending_captain'
    when v_need_admin then 'pending_admin'
    else 'active' end;

  insert into "TeamPlayers" (team_id, player_id, role, status, requested_at, requested_by, joined_at)
  values (p_team_id, p_player_id, 'player', v_status, now(), p_player_id, case when v_status = 'active' then now() end)
  returning * into v_row;

  update "Players" set onboarding = case when v_status = 'active' then 9 else 3 end
  where id = p_player_id and onboarding <> 9;

  if v_status <> 'active' then
    perform public.notify_team_join_request(v_row.id);
  end if;

  return jsonb_build_object('success', true, 'status', v_status);
end $$;

-- ── enforce the rules when a request / invite is accepted ───────────────────
create or replace function pg_temp.patch_fn(p_reg regprocedure, p_from text, p_to text, p_regex boolean default false)
returns void language plpgsql as $$
declare v_def text := pg_get_functiondef(p_reg); v_new text;
begin
  v_new := case when p_regex then regexp_replace(v_def, p_from, p_to, 'g') else replace(v_def, p_from, p_to) end;
  if v_new = v_def then raise exception 'patch for % did not apply (%)', p_reg, left(p_from, 40); end if;
  execute v_new;
end $$;

-- accept_player_join_team_request: block reason, district rule, never act on an invite
select pg_temp.patch_fn('public.accept_player_join_team_request(uuid)'::regprocedure,
  E'if v_tp.requested_by = v_caller_player_id or v_tp.invited_by = v_caller_player_id then',
  E'if v_tp.invited_by is not null then\n        return jsonb_build_object(''success'', false, ''code'', ''not_a_request'', ''message'', ''This is an invite, not a join request'');\n    end if;\n\n    if public.transfer_block_response(v_tp.team_id) is not null then\n        return public.transfer_block_response(v_tp.team_id);\n    end if;\n\n    if public.player_district_conflict(v_tp.team_id, v_tp.player_id, v_tp.id) then\n        return jsonb_build_object(''success'', false, ''code'', ''already_in_district'', ''message'', ''This player is already active on another team in this league'');\n    end if;\n\n    if v_tp.requested_by = v_caller_player_id or v_tp.invited_by = v_caller_player_id then');

-- accept_player_join_team_invite: same block reason before anything is written
select pg_temp.patch_fn('public.accept_player_join_team_invite(uuid)'::regprocedure,
  E'-- determine the prospective status this acceptance would produce, without writing yet',
  E'if public.transfer_block_response(v_tp.team_id) is not null then\n        return public.transfer_block_response(v_tp.team_id);\n    end if;\n\n    -- determine the prospective status this acceptance would produce, without writing yet');

-- captains AND vice captains act for their team (all four responders)
select pg_temp.patch_fn(r, E'role\\s*=\\s*''captain''', E'role in (''captain'', ''vice_captain'')', true)
from unnest(array[
  'public.accept_player_join_team_request(uuid)'::regprocedure,
  'public.accept_player_join_team_invite(uuid)'::regprocedure,
  'public.decline_player_join_team_request(uuid)'::regprocedure,
  'public.revoke_player_join_team_invite(uuid)'::regprocedure]) r;

-- any admin of the team's district counts as admin (not only via DivisionMembers)
select pg_temp.patch_fn(r, 'if not v_is_captain and not v_is_admin then',
  E'v_is_admin := v_is_admin or public.is_district_admin((select district from "Teams" where id = v_tp.team_id));\n    if not v_is_captain and not v_is_admin then')
from unnest(array[
  'public.accept_player_join_team_request(uuid)'::regprocedure,
  'public.decline_player_join_team_request(uuid)'::regprocedure,
  'public.revoke_player_join_team_invite(uuid)'::regprocedure]) r;

select pg_temp.patch_fn('public.accept_player_join_team_invite(uuid)'::regprocedure,
  'if not v_is_player and not v_is_admin then',
  E'v_is_admin := v_is_admin or public.is_district_admin((select district from "Teams" where id = v_tp.team_id));\n    if not v_is_player and not v_is_admin then');

-- ── lists ───────────────────────────────────────────────────────────────────
drop function if exists public.get_pending_join_team_requests(uuid, uuid);

create function public.get_pending_join_team_requests(p_district_id uuid default null, p_team_id uuid default null)
returns table(
  id uuid, team_id uuid, player_id uuid, status text, requested_at timestamptz,
  player jsonb, team jsonb,
  kind text, invited_by uuid, awaiting_captain boolean, awaiting_admin boolean, awaiting_player boolean)
language plpgsql stable set search_path = public as $$
begin
  if p_team_id is null and p_district_id is null then
    raise exception 'MUST_PROVIDE_TEAM_OR_DISTRICT';
  end if;

  return query
  select
    tp.id, tp.team_id, tp.player_id, tp.status, coalesce(tp.requested_at, tp.invited_at),
    jsonb_build_object('id', p.id, 'first_name', p.first_name, 'surname', p.surname, 'avatar_url', p.avatar_url),
    jsonb_build_object('id', t.id, 'display_name', t.display_name, 'crest', t.crest, 'district', t.district),
    case when tp.invited_by is not null then 'invite' else 'request' end,
    tp.invited_by,
    (tp.invited_by is null and tp.status in ('requested', 'pending_captain', 'pending_both')),
    (tp.status in ('pending_admin', 'pending_both')),
    (tp.invited_by is not null and tp.status in ('invited', 'pending_player', 'pending_both'))
  from "TeamPlayers" tp
  join "Teams" t on t.id = tp.team_id
  join "Players" p on p.id = tp.player_id
  where tp.status in ('requested', 'invited', 'pending_admin', 'pending_captain', 'pending_player', 'pending_both')
    and ((p_team_id is not null and tp.team_id = p_team_id)
         or (p_team_id is null and t.district = p_district_id));
end $$;

-- recruiting list: say which approvals a join will need
create or replace function public.get_teams_recruiting(p_district_id uuid)
returns jsonb language sql stable set search_path = public as $$
select coalesce(jsonb_agg(
    jsonb_build_object(
        'id', t.id,
        'display_name', t.display_name,
        'crest', t.crest,
        'division_name', d.name,
        'member_count', (select count(*) from "TeamPlayers" tp where tp.team_id = t.id and tp.status = 'active'),
        'requires_team_approval', a.need_team,
        'requires_admin_approval', a.need_admin,
        'captain', jsonb_build_object(
            'id', cap.id, 'first_name', cap.first_name, 'surname', cap.surname, 'avatar_url', cap.avatar_url)
    ) order by t.display_name
), '[]'::jsonb)
from "Teams" t
left join "DivisionMembers" dm
    on dm.team_id = t.id and dm.member_type = 'team' and dm.status = 'active'
left join "Divisions" d on d.id = dm.division_id
left join "Players" cap on cap.id = public.team_captain_id(t.id)
cross join lateral public.transfer_approvals(t.id) a
where t.district = p_district_id
and t.is_recruiting = true
and t.parent_team_id is null;
$$;

-- ── grants ──────────────────────────────────────────────────────────────────
revoke all on function public.request_player_join_team(uuid), public.invite_player_to_team(uuid, uuid),
  public.request_join_team_onboarding(uuid, uuid, boolean, boolean),
  public.get_pending_join_team_requests(uuid, uuid), public.get_teams_recruiting(uuid) from public, anon;
grant execute on function public.request_player_join_team(uuid), public.invite_player_to_team(uuid, uuid),
  public.request_join_team_onboarding(uuid, uuid, boolean, boolean),
  public.get_pending_join_team_requests(uuid, uuid), public.get_teams_recruiting(uuid) to authenticated;
