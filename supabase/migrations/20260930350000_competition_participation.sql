-- Competition participation: entering, requests, leaving / being removed mid-competition, how the
-- competition carries on afterwards, and awards at the end.
--
--  * join_competition: only while entries are open (status 'upcoming'), deadline day inclusive,
--    the right kind of team (squad competitions take squads, league competitions take main teams),
--    same league / division, a cancelled request can be re-made (it used to block forever)
--  * leaving / removal / a squad going inactive / account deletion all go through withdraw_participant:
--    unplayed fixtures become walkovers for the opponent (both sides gone = void)
--  * knockouts: a round with a missing or withdrawn entrant resolves itself and the bracket carries on
--  * leagues: a server-side table (forfeits were being counted as 0-0 draws), automatic completion when
--    the last fixture is approved, champion / runner-up and their awards
--  * end_season accepted only status 'complete' while competitions finish as 'completed'

-- ── walkover ────────────────────────────────────────────────────────────────
create or replace function public.apply_walkover(p_fixture_id uuid, p_winner_side text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  f "Fixtures"%rowtype; v_best_of int; hw int; aw int; played int; remaining int; hs int; as_ int;
begin
  select * into f from "Fixtures" where id = p_fixture_id for update;
  if not found or f.approved is true then return; end if;

  if p_winner_side is null then
    update "Fixtures"
       set is_forfeited = true, forfeit_reason = p_reason, winner_side = null,
           home_score = 0, away_score = 0, is_complete = true,
           approved = true, approved_at = now(), is_disputed = false, is_escalated = false, updated_at = now()
     where id = p_fixture_id;
  else
    select coalesce(s.best_of, ci.best_of) into v_best_of
      from "CompetitionInstances" ci left join "Stages" s on s.id = f.stage_id
     where ci.id = f.competition_instance_id;

    select count(*) filter (where winner_side = 'home'), count(*) filter (where winner_side = 'away')
      into hw, aw from "Results" where fixture_id = p_fixture_id and winner_side is not null;
    played := hw + aw;
    remaining := case when v_best_of is null then 1 else greatest(v_best_of - played, 0) end;
    if p_winner_side = 'home' then hs := hw + remaining; as_ := aw; else hs := hw; as_ := aw + remaining; end if;

    update "Fixtures"
       set is_forfeited = true, forfeit_reason = p_reason, winner_side = p_winner_side::frame_side,
           home_score = hs, away_score = as_, is_complete = true,
           approved = true, approved_at = now(), is_disputed = false, is_escalated = false, updated_at = now()
     where id = p_fixture_id;
  end if;

  if f.competition_instance_id is not null then
    perform public.maybe_complete_competition(f.competition_instance_id);
  end if;
end $$;
revoke all on function public.apply_walkover(uuid, text, text) from public, anon, authenticated;

-- ── leaving / removal ───────────────────────────────────────────────────────
create or replace function public.withdraw_participant(
  p_participant_id uuid, p_new_status text default 'left', p_reason text default 'Withdrew from the competition')
returns void language plpgsql security definer set search_path = public as $$
declare
  cp "CompetitionParticipants"%rowtype; fx record; v_is_team boolean; v_me uuid; v_side text; v_opp uuid; v_opp_out boolean;
begin
  select * into cp from "CompetitionParticipants" where id = p_participant_id for update;
  if not found or cp.status not in ('active', 'requested') then return; end if;

  update "CompetitionParticipants"
     set status = case when cp.status = 'requested' then 'cancelled' else p_new_status end, left_at = now()
   where id = p_participant_id;
  if cp.status <> 'active' then return; end if;

  v_is_team := cp.team_id is not null;
  v_me := coalesce(cp.team_id, cp.player_id);

  for fx in
    select * from "Fixtures" f
     where f.competition_instance_id = cp.competition_instance_id and f.approved is not true
       and ((v_is_team and (f.home_team = v_me or f.away_team = v_me))
         or (not v_is_team and (f.home_player = v_me or f.away_player = v_me)))
     for update
  loop
    if v_is_team then
      v_side := case when fx.home_team = v_me then 'home' else 'away' end;
      v_opp := case when v_side = 'home' then fx.away_team else fx.home_team end;
    else
      v_side := case when fx.home_player = v_me then 'home' else 'away' end;
      v_opp := case when v_side = 'home' then fx.away_player else fx.home_player end;
    end if;

    -- a knockout slot that has not been filled yet is settled when the round above is processed
    if v_opp is null then continue; end if;

    select not exists (
      select 1 from "CompetitionParticipants" o
       where o.competition_instance_id = cp.competition_instance_id
         and (o.team_id = v_opp or o.player_id = v_opp) and o.status not in ('left', 'removed', 'cancelled'))
      into v_opp_out;

    if v_opp_out then
      perform public.apply_walkover(fx.id, null, 'Both sides withdrew from the competition');
    else
      perform public.apply_walkover(fx.id, case when v_side = 'home' then 'away' else 'home' end,
                                    'Opponent withdrew from the competition');
    end if;
  end loop;
end $$;
revoke all on function public.withdraw_participant(uuid, text, text) from public, anon, authenticated;

create or replace function public.withdraw_team_from_competitions(p_team_id uuid, p_status text default 'left', p_division uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select cp.id from "CompetitionParticipants" cp
    join "CompetitionInstances" ci on ci.id = cp.competition_instance_id
    where cp.team_id = p_team_id and cp.status in ('active', 'requested')
      and ci.status <> 'completed' and (p_division is null or ci.division_id = p_division)
  loop
    perform public.withdraw_participant(r.id, p_status);
  end loop;
end $$;
revoke all on function public.withdraw_team_from_competitions(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.withdraw_player_from_competitions(p_player_id uuid, p_status text default 'left')
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select cp.id from "CompetitionParticipants" cp
    join "CompetitionInstances" ci on ci.id = cp.competition_instance_id
    where cp.player_id = p_player_id and cp.status in ('active', 'requested') and ci.status <> 'completed'
  loop
    perform public.withdraw_participant(r.id, p_status);
  end loop;
end $$;
revoke all on function public.withdraw_player_from_competitions(uuid, text) from public, anon, authenticated;

-- a captain / player withdraws
create or replace function public.withdraw_from_competition(p_instance_id uuid, p_team_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_row "CompetitionParticipants"%rowtype;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Player not found');
  end if;
  if p_team_id is not null then
    if not public.is_team_leader(p_team_id) then
      return jsonb_build_object('success', false, 'code', 'forbidden', 'message', 'Only the captain or vice captain can withdraw the team');
    end if;
    select * into v_row from "CompetitionParticipants"
     where competition_instance_id = p_instance_id and team_id = p_team_id and status in ('active', 'requested');
  else
    select * into v_row from "CompetitionParticipants"
     where competition_instance_id = p_instance_id and player_id = v_me and status in ('active', 'requested');
  end if;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'You are not entered in this competition');
  end if;

  perform public.withdraw_participant(v_row.id, 'left');
  return jsonb_build_object('success', true, 'previousStatus', v_row.status);
end $$;

-- league admins: accept / deny a request, or remove an entrant
create or replace function public.manage_competition_participant(p_participant_id uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cp "CompetitionParticipants"%rowtype; ci "CompetitionInstances"%rowtype; v_district uuid; v_active int;
begin
  select * into cp from "CompetitionParticipants" where id = p_participant_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Entry not found');
  end if;
  select * into ci from "CompetitionInstances" where id = cp.competition_instance_id;
  select district_id into v_district from "Competitions" where id = ci.competition_id;
  if not public.is_district_admin(v_district) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;

  if p_action = 'accept' then
    if cp.status <> 'requested' then
      return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This request is no longer pending');
    end if;
    if ci.status <> 'upcoming' then
      return jsonb_build_object('success', false, 'code', 'entries_closed', 'message', 'Entries are closed for this competition');
    end if;
    if cp.team_id is not null and not exists (select 1 from "Teams" where id = cp.team_id and status = 'active') then
      return jsonb_build_object('success', false, 'code', 'team_not_active', 'message', 'This team is not active');
    end if;
    if ci.max_competitors is not null then
      select count(*) into v_active from "CompetitionParticipants" where competition_instance_id = ci.id and status = 'active';
      if v_active >= ci.max_competitors then
        return jsonb_build_object('success', false, 'code', 'competition_full', 'message', 'The competition is full');
      end if;
    end if;
    update "CompetitionParticipants" set status = 'active', joined_at = now() where id = p_participant_id;
  elsif p_action = 'deny' then
    if cp.status <> 'requested' then
      return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This request is no longer pending');
    end if;
    delete from "CompetitionParticipants" where id = p_participant_id;
  elsif p_action = 'remove' then
    if cp.status <> 'active' then
      return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This entrant is not active');
    end if;
    perform public.withdraw_participant(p_participant_id, 'removed', 'Removed from the competition by a league admin');
  else
    return jsonb_build_object('success', false, 'code', 'invalid_action', 'message', 'Unknown action');
  end if;

  return jsonb_build_object('success', true);
end $$;

-- ── joining ─────────────────────────────────────────────────────────────────
create or replace function public.join_competition(p_instance_id uuid, p_player_id uuid default null, p_team_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_instance record; v_competition record; v_player record; v_team record;
  v_active_count int; v_user_id uuid := auth.uid(); v_team_division uuid; v_size int;
begin
  select * into v_instance from "CompetitionInstances" where id = p_instance_id for update;
  if not found then raise exception 'INSTANCE_NOT_FOUND'; end if;
  select * into v_competition from "Competitions" where id = v_instance.competition_id;

  if v_instance.status is distinct from 'upcoming' then raise exception 'REGISTRATION_CLOSED'; end if;
  -- the deadline day itself is still open
  if v_instance.entry_deadline is not null and current_date > v_instance.entry_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_instance.max_competitors is not null then
    select count(*) into v_active_count from "CompetitionParticipants"
     where competition_instance_id = p_instance_id and status = 'active';
    if v_active_count >= v_instance.max_competitors then raise exception 'COMPETITION_FULL'; end if;
  end if;

  -- ───── TEAM PATH ─────
  if p_team_id is not null then
    if v_competition.competitor_type is distinct from 'team' then raise exception 'WRONG_ENTRY_TYPE'; end if;

    select * into v_team from "Teams" where id = p_team_id;
    if not found then raise exception 'TEAM_NOT_FOUND'; end if;

    if not exists (
      select 1 from "TeamPlayers"
       where team_id = p_team_id and player_id = (select id from "Players" where auth_id = v_user_id)
         and role = 'captain' and status = 'active'
    ) then raise exception 'NOT_CAPTAIN'; end if;

    if v_team.status is distinct from 'active' then raise exception 'TEAM_NOT_ACTIVE'; end if;

    -- squad competitions take squads, league-team competitions take main teams
    if v_competition.team_type = 'child' and v_team.parent_team_id is null then raise exception 'WRONG_TEAM_TYPE'; end if;
    if v_competition.team_type = 'parent' and v_team.parent_team_id is not null then raise exception 'WRONG_TEAM_TYPE'; end if;

    -- same league (and division, for division competitions)
    if coalesce(v_team.district, (select district from "Teams" where id = v_team.parent_team_id))
         is distinct from v_competition.district_id then
      raise exception 'WRONG_LEAGUE';
    end if;
    if v_team.parent_team_id is null and v_instance.division_id is not null then
      v_team_division := public.team_division_id(p_team_id);
      if v_team_division is distinct from v_instance.division_id then raise exception 'WRONG_DIVISION'; end if;
    end if;

    if exists (
      select 1 from "CompetitionParticipants"
       where competition_instance_id = p_instance_id and team_id = p_team_id and status in ('active', 'requested')
    ) then raise exception 'ALREADY_PARTICIPATING'; end if;

    select count(*) into v_size from "TeamPlayers" where team_id = p_team_id and status = 'active';
    if v_instance.max_team_size is not null and v_size > v_instance.max_team_size then raise exception 'TEAM_TOO_LARGE'; end if;
    if v_instance.min_team_size is not null and v_size < v_instance.min_team_size then raise exception 'TEAM_TOO_SMALL'; end if;

    if v_instance.gender is not null and v_instance.gender <> 'mixed' then
      if exists (select 1 from "TeamPlayers" tp join "Players" p on p.id = tp.player_id
                  where tp.team_id = p_team_id and tp.status = 'active' and p.gender <> v_instance.gender) then
        raise exception 'TEAM_GENDER_MISMATCH';
      end if;
    end if;
    if v_instance.min_age is not null then
      if exists (select 1 from "TeamPlayers" tp join "Players" p on p.id = tp.player_id
                  where tp.team_id = p_team_id and tp.status = 'active'
                    and date_part('year', age(p.dob)) < v_instance.min_age) then
        raise exception 'TEAM_PLAYER_TOO_YOUNG';
      end if;
    end if;
    if v_instance.max_age is not null then
      if exists (select 1 from "TeamPlayers" tp join "Players" p on p.id = tp.player_id
                  where tp.team_id = p_team_id and tp.status = 'active'
                    and date_part('year', age(p.dob)) > v_instance.max_age) then
        raise exception 'TEAM_PLAYER_TOO_OLD';
      end if;
    end if;

    insert into "CompetitionParticipants" (competition_instance_id, team_id, status, joined_at, requested_at)
    values (p_instance_id, p_team_id,
            case when v_instance.entry_type = 'request' then 'requested' else 'active' end,
            case when v_instance.entry_type = 'request' then null else now() end,
            case when v_instance.entry_type = 'request' then now() else null end);

  -- ───── PLAYER PATH ─────
  else
    if v_competition.competitor_type is distinct from 'individual' then raise exception 'WRONG_ENTRY_TYPE'; end if;

    select * into v_player from "Players" where id = p_player_id and auth_id = v_user_id;
    if not found then raise exception 'UNAUTHORIZED'; end if;

    if exists (
      select 1 from "CompetitionParticipants"
       where competition_instance_id = p_instance_id and player_id = p_player_id and status in ('active', 'requested')
    ) then raise exception 'ALREADY_PARTICIPATING'; end if;

    if v_instance.gender is not null and v_instance.gender <> 'mixed' and v_player.gender <> v_instance.gender then
      raise exception 'GENDER_MISMATCH';
    end if;
    if v_instance.min_age is not null and date_part('year', age(v_player.dob)) < v_instance.min_age then
      raise exception 'PLAYER_TOO_YOUNG';
    end if;
    if v_instance.max_age is not null and date_part('year', age(v_player.dob)) > v_instance.max_age then
      raise exception 'PLAYER_TOO_OLD';
    end if;

    insert into "CompetitionParticipants" (competition_instance_id, player_id, status, joined_at, requested_at)
    values (p_instance_id, p_player_id,
            case when v_instance.entry_type = 'request' then 'requested' else 'active' end,
            case when v_instance.entry_type = 'request' then null else now() end,
            case when v_instance.entry_type = 'request' then now() else null end);
  end if;
end $$;

-- ── squads / accounts / division removal feed the same path ─────────────────
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
      -- an inactive squad cannot play on: it leaves its competitions (walkovers for its opponents)
      perform public.withdraw_team_from_competitions(r.id, 'left');
    end if;
  end loop;
  return new;
end $$;

do $patch$
declare v_def text; v_new text;
begin
  -- account deletion: leave individual competitions properly (walkovers), not just flip a status
  v_def := pg_get_functiondef('public.delete_user_account()'::regprocedure);
  v_new := regexp_replace(v_def,
    'update\s+"CompetitionParticipants"\s+set\s+status\s*=\s*''left'',\s*left_at\s*=\s*now\(\)\s+where\s+player_id\s*=\s*v_player_id\s+and\s+status\s*=\s*''active'';',
    'perform public.withdraw_player_from_competitions(v_player_id);');
  if v_new = v_def then raise exception 'delete_user_account patch failed'; end if;
  execute v_new;

  -- removing a team from its division takes it out of that division's competitions
  v_def := pg_get_functiondef('public.remove_team_from_division(uuid)'::regprocedure);
  v_new := replace(v_def, 'update "Teams" set division = null',
    E'perform public.withdraw_team_from_competitions(p_team_id, ''removed'', public.team_division_id(p_team_id));\n  update "Teams" set division = null');
  if v_new = v_def then raise exception 'remove_team_from_division patch failed'; end if;
  execute v_new;

  -- switching a squad off is blocked while a competition is open or running (entries closed counts too)
  v_def := pg_get_functiondef('public.set_child_team_active(uuid,boolean)'::regprocedure);
  v_new := replace(v_def, 'ci.status in (''active'', ''upcoming'')', 'ci.status in (''active'', ''upcoming'', ''closed'')');
  if v_new = v_def then raise exception 'set_child_team_active patch failed'; end if;
  execute v_new;

  -- a season can end once every competition is finished (they finish as 'completed')
  v_def := pg_get_functiondef('public.end_season(uuid)'::regprocedure);
  v_new := replace(v_def, 'ci.status <> ''complete''', 'ci.status not in (''completed'', ''complete'', ''cancelled'')');
  if v_new = v_def then raise exception 'end_season patch failed'; end if;
  execute v_new;
end
$patch$;

-- ── league table, completion and awards ─────────────────────────────────────
create or replace function public.competition_standings(p_ci uuid)
returns table(
  id uuid, display_name text, crest jsonb, played int, won int, drawn int, lost int, points int,
  frames_for int, frames_against int, frame_diff int, special_match int, withdrawn boolean, "position" int)
language plpgsql stable security definer set search_path = public as $$
declare ci "CompetitionInstances"%rowtype; v_type text;
begin
  select * into ci from "CompetitionInstances" where "CompetitionInstances".id = p_ci;
  select c.competitor_type::text into v_type from "Competitions" c where c.id = ci.competition_id;

  return query
  with fx as (
    select f.id as fid,
           case when v_type = 'team' then f.home_team else f.home_player end as h,
           case when v_type = 'team' then f.away_team else f.away_player end as a,
           f.is_forfeited, f.home_score, f.away_score
    from "Fixtures" f
    where f.competition_instance_id = p_ci and f.approved is true
      and (f.is_forfeited is not true or f.winner_side is not null)
  ), fr as (
    select r.fixture_id,
           count(*) filter (where r.winner_side = 'home' and r.bonus_frame is not true) as hf,
           count(*) filter (where r.winner_side = 'away' and r.bonus_frame is not true) as af,
           count(*) filter (where r.winner_side = 'home' and r.bonus_frame is true) as hb,
           count(*) filter (where r.winner_side = 'away' and r.bonus_frame is true) as ab
    from "Results" r where r.fixture_id in (select fid from fx) group by r.fixture_id
  ), scored as (
    select fx.h, fx.a,
           case when fx.is_forfeited then coalesce(fx.home_score, 0) else coalesce(fr.hf, 0) end as hf,
           case when fx.is_forfeited then coalesce(fx.away_score, 0) else coalesce(fr.af, 0) end as af,
           case when fx.is_forfeited then 0 else coalesce(fr.hb, 0) end as hb,
           case when fx.is_forfeited then 0 else coalesce(fr.ab, 0) end as ab
    from fx left join fr on fr.fixture_id = fx.fid
  ), sides as (
    select s.h as pid, s.hf as f_for, s.af as f_against, s.hb as bonus from scored s
    union all
    select s.a, s.af, s.hf, s.ab from scored s
  ), agg as (
    select sd.pid,
           count(*)::int as played,
           (count(*) filter (where sd.f_for > sd.f_against))::int as won,
           (count(*) filter (where sd.f_for = sd.f_against))::int as drawn,
           (count(*) filter (where sd.f_for < sd.f_against))::int as lost,
           coalesce(sum(sd.f_for), 0)::int as ff,
           coalesce(sum(sd.f_against), 0)::int as fa,
           coalesce(sum(sd.bonus), 0)::int as sp,
           coalesce(sum(greatest(sd.f_for - sd.f_against, 0)), 0)::int as win_margin
    from sides sd group by sd.pid
  ), parts as (
    select coalesce(cp.team_id, cp.player_id) as pid, cp.status
    from "CompetitionParticipants" cp
    where cp.competition_instance_id = p_ci
      and cp.status in ('active', 'left', 'removed', 'champion', 'runner_up', 'eliminated')
  ), rows_ as (
    select p.pid,
           case when v_type = 'team' then (select t.display_name from "Teams" t where t.id = p.pid)
                else (select trim(pl.first_name || ' ' || pl.surname) from "Players" pl where pl.id = p.pid) end as nm,
           case when v_type = 'team' then (select t.crest from "Teams" t where t.id = p.pid)
                else (select to_jsonb(pl.avatar_url) from "Players" pl where pl.id = p.pid) end as cr,
           coalesce(a.played, 0) as played, coalesce(a.won, 0) as won, coalesce(a.drawn, 0) as drawn, coalesce(a.lost, 0) as lost,
           coalesce(a.ff, 0) as ff, coalesce(a.fa, 0) as fa, coalesce(a.sp, 0) as sp,
           case ci.scoring_system
             when 'points' then coalesce(a.won, 0) * coalesce(ci.points_for_win, 3)
                              + coalesce(a.drawn, 0) * coalesce(ci.points_for_draw, 1)
                              + coalesce(a.lost, 0) * coalesce(ci.points_for_loss, 0)
             when 'frame_diff' then coalesce(a.win_margin, 0)
             else coalesce(a.ff, 0) end as pts,
           (p.status in ('left', 'removed')) as wd
    from parts p left join agg a on a.pid = p.pid
    where p.status not in ('left', 'removed') or coalesce(a.played, 0) > 0
  )
  select r.pid, r.nm, r.cr, r.played, r.won, r.drawn, r.lost, r.pts::int, r.ff, r.fa, (r.ff - r.fa), r.sp, r.wd,
         (row_number() over (order by r.pts desc, (r.ff - r.fa) desc, r.ff desc, r.nm asc))::int
  from rows_ r
  order by 14;
end $$;
revoke all on function public.competition_standings(uuid) from public, anon;
grant execute on function public.competition_standings(uuid) to authenticated;

create or replace function public.get_division_standings(p_division_id uuid, p_season_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ci "CompetitionInstances"%rowtype; v_div "Divisions"%rowtype; v_rows jsonb;
begin
  select * into v_div from "Divisions" where id = p_division_id;
  select ci.* into v_ci
    from "CompetitionInstances" ci join "Competitions" c on c.id = ci.competition_id
   where ci.division_id = p_division_id and ci.season_id = p_season_id and c.competition_type = 'league'
   order by ci.created_at desc limit 1;

  if v_ci.id is null then
    -- no league set up for this season yet: list the division's teams on zero
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'display_name', t.display_name, 'crest', t.crest, 'played', 0, 'won', 0, 'lost', 0, 'drawn', 0,
        'points', 0, 'frames_for', 0, 'frames_against', 0, 'frame_diff', 0, 'special_match', 0, 'withdrawn', false,
        'position', row_number() over (order by t.display_name)) order by t.display_name), '[]'::jsonb)
      into v_rows
      from "DivisionMembers" dm join "Teams" t on t.id = dm.team_id
     where dm.division_id = p_division_id and dm.status = 'active' and dm.member_type = 'team';
    return jsonb_build_object(
      'division', jsonb_build_object('id', v_div.id, 'name', v_div.name, 'promotion_spots', v_div.promotion_spots,
        'relegation_spots', v_div.relegation_spots, 'special_match', null, 'draws_allowed', null, 'scoring_system', null,
        'points_for_win', null, 'points_for_draw', null, 'points_for_loss', null),
      'standings', v_rows);
  end if;

  select coalesce(jsonb_agg(to_jsonb(s) order by s."position"), '[]'::jsonb) into v_rows
    from public.competition_standings(v_ci.id) s;

  return jsonb_build_object(
    'division', jsonb_build_object('id', v_div.id, 'name', v_div.name,
      'promotion_spots', coalesce(v_ci.promotion_spots, v_div.promotion_spots),
      'relegation_spots', coalesce(v_ci.relegation_spots, v_div.relegation_spots),
      'special_match', v_ci.special_match, 'draws_allowed', v_ci.draws_allowed, 'scoring_system', v_ci.scoring_system,
      'points_for_win', v_ci.points_for_win, 'points_for_draw', v_ci.points_for_draw, 'points_for_loss', v_ci.points_for_loss),
    'standings', v_rows);
end $$;
revoke all on function public.get_division_standings(uuid, uuid) from public, anon;
grant execute on function public.get_division_standings(uuid, uuid) to authenticated;

-- finishing a league: champion, runner-up and their awards
create or replace function public._complete_league(p_ci uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  ci "CompetitionInstances"%rowtype; v_type text; v_first uuid; v_second uuid;
begin
  select * into ci from "CompetitionInstances" where id = p_ci for update;
  if not found or ci.status = 'completed' then return; end if;
  select c.competitor_type::text into v_type from "Competitions" c where c.id = ci.competition_id;

  select s.id into v_first from public.competition_standings(p_ci) s where not s.withdrawn order by s."position" limit 1;
  select s.id into v_second from public.competition_standings(p_ci) s where not s.withdrawn order by s."position" offset 1 limit 1;

  update "CompetitionParticipants" set status = 'champion'
   where competition_instance_id = p_ci and status = 'active' and (team_id = v_first or player_id = v_first);
  update "CompetitionParticipants" set status = 'runner_up'
   where competition_instance_id = p_ci and status = 'active' and (team_id = v_second or player_id = v_second);

  if v_type = 'team' then
    if ci.winner_reward is not null and v_first is not null then
      insert into "TeamAwards" (team_id, season_id, division_id, result, reward) values (v_first, ci.season_id, ci.division_id, '1', ci.winner_reward);
    end if;
    if ci.runner_up_reward is not null and v_second is not null then
      insert into "TeamAwards" (team_id, season_id, division_id, result, reward) values (v_second, ci.season_id, ci.division_id, '2', ci.runner_up_reward);
    end if;
  else
    if ci.winner_reward is not null and v_first is not null then
      insert into "PlayerAwards" (player_id, season_id, division_id, competition_instance_id, result, reward)
      values (v_first, ci.season_id, ci.division_id, p_ci, '1', ci.winner_reward);
    end if;
    if ci.runner_up_reward is not null and v_second is not null then
      insert into "PlayerAwards" (player_id, season_id, division_id, competition_instance_id, result, reward)
      values (v_second, ci.season_id, ci.division_id, p_ci, '2', ci.runner_up_reward);
    end if;
  end if;

  update "Stages" set status = 'completed', completed_at = coalesce(completed_at, now())
   where competition_instance_id = p_ci and status <> 'completed';
  update "CompetitionInstances" set status = 'completed', updated_at = now() where id = p_ci;
end $$;
revoke all on function public._complete_league(uuid) from public, anon, authenticated;

create or replace function public.maybe_complete_competition(p_ci uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ci "CompetitionInstances"%rowtype; v_kind text;
begin
  select * into ci from "CompetitionInstances" where id = p_ci;
  if not found or ci.status <> 'active' then return; end if;
  select c.competition_type::text into v_kind from "Competitions" c where c.id = ci.competition_id;
  if v_kind <> 'league' then return; end if;
  if not exists (select 1 from "Fixtures" where competition_instance_id = p_ci) then return; end if;
  if exists (select 1 from "Fixtures" where competition_instance_id = p_ci and approved is not true) then return; end if;
  perform public._complete_league(p_ci);
end $$;
revoke all on function public.maybe_complete_competition(uuid) from public, anon, authenticated;

-- manual finish for league admins (normally automatic when the last fixture is approved)
create or replace function public.complete_league_competition(p_instance_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ci "CompetitionInstances"%rowtype; v_district uuid;
begin
  select * into ci from "CompetitionInstances" where id = p_instance_id;
  if not found then return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Competition not found'); end if;
  select district_id into v_district from "Competitions" where id = ci.competition_id;
  if not public.is_district_admin(v_district) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if ci.status <> 'active' then
    return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This competition is not running');
  end if;
  if exists (select 1 from "Fixtures" where competition_instance_id = p_instance_id and approved is not true) then
    return jsonb_build_object('success', false, 'code', 'fixtures_outstanding', 'message', 'Every fixture must be approved first');
  end if;
  perform public._complete_league(p_instance_id);
  return jsonb_build_object('success', true);
end $$;

-- every approved fixture can be the last one of a league
do $patch$
declare v_def text := pg_get_functiondef('public.update_player_stats_for_fixture(uuid)'::regprocedure); v_new text;
begin
  v_new := regexp_replace(v_def,
    'return\s+jsonb_build_object\(\s*''success'',\s*true,\s*''code'',\s*''stats_updated''',
    E'perform public.maybe_complete_competition((select competition_instance_id from "Fixtures" where id = p_fixture_id));\n\n  return jsonb_build_object(''success'', true, ''code'', ''stats_updated''');
  if v_new = v_def then raise exception 'update_player_stats_for_fixture patch failed'; end if;
  execute v_new;
end
$patch$;

-- ── knockout progression ────────────────────────────────────────────────────
create or replace function public.progress_stage(p_competition_instance_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_stage_id uuid; v_stage_order int; v_comp_type text; v_has_incomplete boolean; v_next_stage_id uuid;
  v_id uuid; v_home_team uuid; v_away_team uuid; v_home_player uuid; v_away_player uuid; v_winner_side text;
  v_parent_fixture_id uuid; v_parent_slot text;
  v_winner_reward text; v_runner_up_reward text; v_season_id uuid; v_division_id uuid; v_winner_id uuid; v_runner_up_id uuid;
  winner_id uuid; loser_id uuid; fx record; v_h uuid; v_a uuid; v_h_in boolean; v_a_in boolean;
begin
  if not public.is_district_admin(public.competition_instance_district(p_competition_instance_id)) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;

  select s.id, s.stage_order into v_stage_id, v_stage_order
    from "Stages" s
   where s.competition_instance_id = p_competition_instance_id and s.stage_type = 'knockout' and s.status = 'active'
   order by s.stage_order asc limit 1;

  if v_stage_id is null then
    raise exception using errcode = 'P0001', message = 'NO_ACTIVE_STAGE',
      detail = json_build_object('competition_instance_id', p_competition_instance_id,
                                 'title', 'No Active Stage Found', 'reason', 'Cannot progress tournament')::text;
  end if;

  update "Stages" set status = 'processing' where id = v_stage_id;

  select exists (select 1 from "Fixtures" where stage_id = v_stage_id and approved is not true) into v_has_incomplete;
  if v_has_incomplete then
    update "Stages" set status = 'active' where id = v_stage_id;
    raise exception using errcode = 'P0001', message = 'STAGE_NOT_READY',
      detail = json_build_object('stage_id', v_stage_id, 'title', 'Outstanding Fixtures',
                                 'reason', 'All fixtures must be complete and approved before progression')::text;
  end if;

  select competitor_type into v_comp_type from "Fixtures" where stage_id = v_stage_id limit 1;

  for v_id, v_home_team, v_away_team, v_home_player, v_away_player, v_winner_side in
    select id, home_team, away_team, home_player, away_player, winner_side::text
      from "Fixtures" where stage_id = v_stage_id and approved = true
  loop
    -- a void fixture (nobody left to play it) has no winner and nobody to eliminate
    if v_winner_side is null then continue; end if;

    if v_comp_type = 'team' then
      winner_id := case when v_winner_side = 'home' then v_home_team else v_away_team end;
      loser_id  := case when v_winner_side = 'home' then v_away_team else v_home_team end;
    else
      winner_id := case when v_winner_side = 'home' then v_home_player else v_away_player end;
      loser_id  := case when v_winner_side = 'home' then v_away_player else v_home_player end;
    end if;

    select parent_fixture_id, parent_slot into v_parent_fixture_id, v_parent_slot from "Fixtures" where id = v_id;

    if v_parent_fixture_id is not null and winner_id is not null then
      if v_comp_type = 'team' then
        if v_parent_slot = 'home' then
          update "Fixtures" set home_team = winner_id where id = v_parent_fixture_id and home_team is null;
        else
          update "Fixtures" set away_team = winner_id where id = v_parent_fixture_id and away_team is null;
        end if;
      else
        if v_parent_slot = 'home' then
          update "Fixtures" set home_player = winner_id where id = v_parent_fixture_id and home_player is null;
        else
          update "Fixtures" set away_player = winner_id where id = v_parent_fixture_id and away_player is null;
        end if;
      end if;
    end if;

    -- only entrants still in the competition become "eliminated" (leavers keep their own status)
    if loser_id is not null then
      update "CompetitionParticipants" set status = 'eliminated'
       where competition_instance_id = p_competition_instance_id and status = 'active'
         and ((v_comp_type = 'team' and team_id = loser_id) or (v_comp_type <> 'team' and player_id = loser_id));
    end if;
  end loop;

  select id into v_next_stage_id from "Stages"
   where competition_instance_id = p_competition_instance_id and stage_type = 'knockout' and stage_order > v_stage_order
   order by stage_order asc limit 1;

  select winner_reward, runner_up_reward, season_id, division_id
    into v_winner_reward, v_runner_up_reward, v_season_id, v_division_id
    from "CompetitionInstances" where id = p_competition_instance_id;

  if v_next_stage_id is null then
    -- the final
    if v_comp_type = 'team' then
      select case when winner_side = 'home' then home_team else away_team end,
             case when winner_side = 'home' then away_team else home_team end
        into v_winner_id, v_runner_up_id from "Fixtures" where stage_id = v_stage_id and winner_side is not null limit 1;
    else
      select case when winner_side = 'home' then home_player else away_player end,
             case when winner_side = 'home' then away_player else home_player end
        into v_winner_id, v_runner_up_id from "Fixtures" where stage_id = v_stage_id and winner_side is not null limit 1;
    end if;

    if v_winner_id is not null then
      update "CompetitionParticipants" set status = 'champion'
       where competition_instance_id = p_competition_instance_id and (team_id = v_winner_id or player_id = v_winner_id);
    end if;
    if v_runner_up_id is not null then
      update "CompetitionParticipants" set status = 'runner_up'
       where competition_instance_id = p_competition_instance_id and status in ('eliminated', 'left', 'removed')
         and (team_id = v_runner_up_id or player_id = v_runner_up_id);
    end if;

    if v_comp_type = 'team' then
      if v_winner_reward is not null and v_winner_id is not null then
        insert into "TeamAwards" (team_id, season_id, division_id, result, reward) values (v_winner_id, v_season_id, v_division_id, '1', v_winner_reward);
      end if;
      if v_runner_up_reward is not null and v_runner_up_id is not null then
        insert into "TeamAwards" (team_id, season_id, division_id, result, reward) values (v_runner_up_id, v_season_id, v_division_id, '2', v_runner_up_reward);
      end if;
    else
      if v_winner_reward is not null and v_winner_id is not null then
        insert into "PlayerAwards" (player_id, season_id, division_id, competition_instance_id, result, reward)
        values (v_winner_id, v_season_id, v_division_id, p_competition_instance_id, '1', v_winner_reward);
      end if;
      if v_runner_up_reward is not null and v_runner_up_id is not null then
        insert into "PlayerAwards" (player_id, season_id, division_id, competition_instance_id, result, reward)
        values (v_runner_up_id, v_season_id, v_division_id, p_competition_instance_id, '2', v_runner_up_reward);
      end if;
    end if;

    update "CompetitionInstances" set status = 'completed', updated_at = now() where id = p_competition_instance_id;
  else
    update "Stages" set status = 'active', started_at = now() where id = v_next_stage_id;

    -- round settles itself where an entrant is missing or has withdrawn
    for fx in select * from "Fixtures" where stage_id = v_next_stage_id and approved is not true loop
      if v_comp_type = 'team' then v_h := fx.home_team; v_a := fx.away_team; else v_h := fx.home_player; v_a := fx.away_player; end if;
      v_h_in := v_h is not null and exists (select 1 from "CompetitionParticipants" p
                  where p.competition_instance_id = p_competition_instance_id and p.status = 'active' and (p.team_id = v_h or p.player_id = v_h));
      v_a_in := v_a is not null and exists (select 1 from "CompetitionParticipants" p
                  where p.competition_instance_id = p_competition_instance_id and p.status = 'active' and (p.team_id = v_a or p.player_id = v_a));
      if v_h_in and v_a_in then continue; end if;
      if v_h_in then perform public.apply_walkover(fx.id, 'home', 'No opponent');
      elsif v_a_in then perform public.apply_walkover(fx.id, 'away', 'No opponent');
      else perform public.apply_walkover(fx.id, null, 'No entrants');
      end if;
    end loop;
  end if;

  update "Stages" set status = 'completed', completed_at = now() where id = v_stage_id;

  insert into "CompetitionStageProgressLog" (competition_instance_id, stage_id, notes)
  values (p_competition_instance_id, v_stage_id, 'Stage progressed successfully');

  -- if the whole next round settled itself, carry straight on
  if v_next_stage_id is not null
     and not exists (select 1 from "Fixtures" where stage_id = v_next_stage_id and approved is not true) then
    perform public.progress_stage(p_competition_instance_id);
  end if;
end $$;

revoke all on function public.withdraw_from_competition(uuid, uuid), public.manage_competition_participant(uuid, text),
  public.join_competition(uuid, uuid, uuid), public.get_division_standings(uuid, uuid),
  public.complete_league_competition(uuid), public.progress_stage(uuid), public.squads_on_member_leave() from public, anon;
grant execute on function public.withdraw_from_competition(uuid, uuid), public.manage_competition_participant(uuid, text),
  public.join_competition(uuid, uuid, uuid), public.get_division_standings(uuid, uuid),
  public.complete_league_competition(uuid), public.progress_stage(uuid) to authenticated;
revoke execute on function public.squads_on_member_leave() from authenticated;
