-- League competitions are finalised when the admin ends the season from the season card:
-- champion / runner-up awards are issued and promotion / relegation is applied between divisions
-- (same league, same group, neighbouring tiers; tier 1 is the top). Knockouts still finish themselves
-- when the final is approved.

-- leagues no longer complete on their own
create or replace function public.maybe_complete_competition(p_ci uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  return; -- leagues are finalised by end_season
end $$;
revoke all on function public.maybe_complete_competition(uuid) from public, anon, authenticated;

drop function if exists public.complete_league_competition(uuid);

-- removing a team from its division also closes its DivisionMembers row
-- (team_division_id prefers DivisionMembers, so the old row kept the team in the division)
create or replace function public.remove_team_from_division(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_district_admin((select district from "Teams" where id = p_team_id)) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  perform public.withdraw_team_from_competitions(p_team_id, 'removed', public.team_division_id(p_team_id));
  update "DivisionMembers" set status = 'left', left_at = now()
   where team_id = p_team_id and status in ('active', 'pending_admin', 'pending_team');
  update "Teams" set division = null, updated_at = now() where id = p_team_id;
end $$;

create or replace function public.end_season(p_season_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_blockers json;
  ci record; r record; v_moves jsonb := '[]'::jsonb;
  v_up uuid; v_down uuid; v_ids uuid[]; v_type text; v_tier int; v_group int; v_district uuid; v_n int;
  v_awards int := 0;
begin
  if not public.is_district_admin((select district from "Seasons" where id = p_season_id)) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;

  -- anything unfinished blocks the season. A running league with every fixture approved is fine:
  -- it is finalised below.
  select json_agg(json_build_object(
           'id', c.id, 'name', c.name, 'status', c.status,
           'reason', case when k.competition_type = 'league' and c.status = 'active' then 'Fixtures still to be approved'
                          else 'Not finished' end))
    into v_blockers
    from "CompetitionInstances" c
    join "Competitions" k on k.id = c.competition_id
   where c.season_id = p_season_id
     and c.status not in ('completed', 'complete', 'cancelled')
     and not (k.competition_type = 'league' and c.status = 'active'
              and exists (select 1 from "Fixtures" f where f.competition_instance_id = c.id)
              and not exists (select 1 from "Fixtures" f where f.competition_instance_id = c.id and f.approved is not true));

  if v_blockers is not null then
    return json_build_object('success', false, 'error', 'Not all competitions are complete',
                             'incomplete_competitions', v_blockers);
  end if;

  -- 1. finalise leagues (awards) and work out the movements from the final tables
  for ci in
    select c.id, c.division_id, c.status, k.competitor_type::text as ctype,
           coalesce(c.promotion_spots, d.promotion_spots, 0) as promo,
           coalesce(c.relegation_spots, d.relegation_spots, 0) as releg
      from "CompetitionInstances" c
      join "Competitions" k on k.id = c.competition_id
      left join "Divisions" d on d.id = c.division_id
     where c.season_id = p_season_id and k.competition_type = 'league'
       and c.status in ('active', 'completed')
  loop
    if ci.status = 'active' then
      perform public._complete_league(ci.id);
    end if;
    if ci.division_id is null then continue; end if;

    select tier, group_id, district into v_tier, v_group, v_district from "Divisions" where id = ci.division_id;
    v_type := ci.ctype;

    -- neighbouring divisions in the same ladder
    select id into v_up from "Divisions"
     where district = v_district and group_id is not distinct from v_group and competitor_type::text = v_type and tier < v_tier
     order by tier desc limit 1;
    select id into v_down from "Divisions"
     where district = v_district and group_id is not distinct from v_group and competitor_type::text = v_type and tier > v_tier
     order by tier asc limit 1;

    select array_agg(s.id order by s."position") into v_ids
      from public.competition_standings(ci.id) s where not s.withdrawn;
    v_n := coalesce(array_length(v_ids, 1), 0);

    if v_up is not null and ci.promo > 0 then
      for r in select u as eid from unnest(v_ids[1:least(ci.promo, v_n)]) u loop
        v_moves := v_moves || jsonb_build_object('id', r.eid, 'type', v_type, 'from', ci.division_id, 'to', v_up, 'movement', 'promoted');
      end loop;
    end if;
    if v_down is not null and ci.releg > 0 then
      for r in select u as eid from unnest(v_ids[greatest(v_n - ci.releg + 1, ci.promo + 1):v_n]) u loop
        v_moves := v_moves || jsonb_build_object('id', r.eid, 'type', v_type, 'from', ci.division_id, 'to', v_down, 'movement', 'relegated');
      end loop;
    end if;
  end loop;

  -- 2. apply them all at once (computed first, so swaps between tiers do not interfere)
  for r in select * from jsonb_to_recordset(v_moves) as x(id uuid, type text, "from" uuid, "to" uuid, movement text) loop
    if r.type = 'team' then
      update "DivisionMembers" set division_id = r."to"
       where team_id = r.id and division_id = r."from" and status = 'active';
      update "Teams" set division = r."to", updated_at = now() where id = r.id;
    else
      update "DivisionMembers" set division_id = r."to"
       where player_id = r.id and division_id = r."from" and status = 'active';
      update "Players" set division = r."to" where id = r.id;
    end if;
  end loop;

  select (select count(*) from "TeamAwards" where season_id = p_season_id)
       + (select count(*) from "PlayerAwards" where season_id = p_season_id) into v_awards;

  update "Seasons" set status = 'complete', end_date = now() where id = p_season_id;

  return json_build_object('success', true, 'message', 'Season marked as complete',
    'awards_issued', v_awards,
    'promoted', (select count(*) from jsonb_array_elements(v_moves) m where m->>'movement' = 'promoted'),
    'relegated', (select count(*) from jsonb_array_elements(v_moves) m where m->>'movement' = 'relegated'));
end $$;
revoke all on function public.end_season(uuid) from public, anon;
grant execute on function public.end_season(uuid) to authenticated;
