-- Season lifecycle, division capacity on approval, lineup eligibility, stat rebuilds and corrections,
-- admin captain assignment, and season-end notifications.

-- ── 1. Seasons: draft -> active -> complete, one active season per league ────
alter table "Seasons" drop constraint if exists seasons_status_check;
alter table "Seasons" add constraint seasons_status_check check (status in ('draft', 'active', 'complete'));
create unique index if not exists seasons_one_active_per_district on "Seasons" (district) where status = 'active';

create or replace function public.enforce_season_lifecycle()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'active') then
      raise exception 'A new season must start as draft or active' using errcode = 'P0001';
    end if;
  elsif new.status is distinct from old.status then
    if not ((old.status = 'draft' and new.status = 'active') or (old.status = 'active' and new.status = 'complete')) then
      raise exception 'A season can only go draft -> active -> complete (% -> % is not allowed)', old.status, new.status
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_enforce_season_lifecycle on "Seasons";
create trigger trg_enforce_season_lifecycle before insert or update of status on "Seasons"
  for each row execute function public.enforce_season_lifecycle();

create or replace function public.next_season_name(p_last text)
returns text language plpgsql immutable as $$
declare m text[];
begin
  if p_last is null then return 'New Season'; end if;
  m := regexp_match(p_last, '(\d{4})\s*([/-])\s*(\d{2,4})');
  if m is not null then
    return regexp_replace(p_last, '(\d{4})\s*([/-])\s*(\d{2,4})',
      ((m[1]::int) + 1)::text || m[2] ||
      case when length(m[3]) = 2 then lpad((((m[3]::int) + 1) % 100)::text, 2, '0') else ((m[3]::int) + 1)::text end);
  end if;
  m := regexp_match(p_last, '(\d+)\s*$');
  if m is not null then
    return regexp_replace(p_last, '(\d+)\s*$', ((m[1]::int) + 1)::text);
  end if;
  return p_last || ' 2';
end $$;

create or replace function public.start_new_season(p_district_id uuid, p_name text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_season "Seasons"%rowtype; v_last text; v_name text; v_district_name text;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'title', 'Failed to start season', 'message', 'Player not found');
  end if;
  if not public.is_district_admin(p_district_id) then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'title', 'Failed to start season',
                              'message', 'You are not authorised to manage seasons for this district');
  end if;

  perform 1 from "Districts" where id = p_district_id for update; -- serialise concurrent starts

  if exists (select 1 from "Seasons" where district = p_district_id and status = 'active') then
    return jsonb_build_object('success', false, 'code', 'season_active', 'title', 'Season still running',
                              'message', 'End the current season before starting a new one.');
  end if;

  -- a draft season is activated rather than creating another one
  select * into v_season from "Seasons" where district = p_district_id and status = 'draft'
   order by start_date desc nulls last, created_at desc limit 1 for update;
  if found then
    update "Seasons"
       set status = 'active', start_date = least(coalesce(start_date, current_date), current_date),
           name = coalesce(nullif(trim(coalesce(p_name, '')), ''), name)
     where id = v_season.id returning * into v_season;
  else
    select name into v_last from "Seasons" where district = p_district_id order by start_date desc nulls last, created_at desc limit 1;
    v_name := coalesce(nullif(trim(coalesce(p_name, '')), ''), public.next_season_name(v_last));
    insert into "Seasons" (name, district, start_date, status) values (v_name, p_district_id, current_date, 'active')
    returning * into v_season;
  end if;

  select name into v_district_name from "Districts" where id = p_district_id;

  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select distinct pl.id, 'season_started', 'New season started',
         v_season.name || ' has begun in ' || v_district_name || '.', v_season.id, 'season',
         jsonb_build_object('districtId', p_district_id, 'seasonId', v_season.id)
    from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id join "Players" pl on pl.id = tp.player_id
   where t.district = p_district_id and tp.status = 'active'
  union
  select da.user_id, 'season_started', 'New season started',
         v_season.name || ' has begun in ' || v_district_name || '.', v_season.id, 'season',
         jsonb_build_object('districtId', p_district_id, 'seasonId', v_season.id)
    from "DistrictAdmins" da where da.district_id = p_district_id;

  return jsonb_build_object('success', true, 'previousSeason', null, 'newSeason', to_jsonb(v_season));
end $$;
revoke all on function public.start_new_season(uuid, text) from public, anon;
grant execute on function public.start_new_season(uuid, text) to authenticated;

-- ── 2. Notification types ────────────────────────────────────────────────────
insert into "NotificationTypeCategories" (type, category) values
  ('season_ended', 'league'), ('season_award', 'league'), ('team_promoted', 'league'), ('team_relegated', 'league')
on conflict do nothing;

-- ── 3. End of season: finalise, move divisions, notify ──────────────────────
create or replace function public.end_season(p_season_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_blockers json; v_season "Seasons"%rowtype;
  ci record; r record; v_moves jsonb := '[]'::jsonb;
  v_up uuid; v_down uuid; v_ids uuid[]; v_type text; v_tier int; v_group int; v_district uuid; v_n int;
  v_awards int := 0;
begin
  select * into v_season from "Seasons" where id = p_season_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'Season not found');
  end if;
  if not public.is_district_admin(v_season.district) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_season.status <> 'active' then
    return json_build_object('success', false, 'error', 'Only a running season can be ended');
  end if;

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

  -- ── notifications ──
  -- generic: everyone involved in the league
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select distinct x.pid, 'season_ended', 'Season ended',
         v_season.name || ' has ended. Thanks for playing!', p_season_id, 'season',
         jsonb_build_object('districtId', v_season.district, 'seasonId', p_season_id)
    from (
      select tp.player_id as pid from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
       where t.district = v_season.district and tp.status = 'active'
      union
      select da.user_id from "DistrictAdmins" da where da.district_id = v_season.district
      union
      select dm.player_id from "DivisionMembers" dm join "Divisions" d on d.id = dm.division_id
       where d.district = v_season.district and dm.status = 'active' and dm.player_id is not null
    ) x where x.pid is not null;

  -- team awards -> the team's current players
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select distinct tp.player_id, 'season_award',
         case ta.result when '1' then 'Champions!' else 'Runners-up!' end,
         case ta.result
           when '1' then t.display_name || ' won ' || coalesce(dv.name, 'the competition') || ' in ' || v_season.name || '.'
           else t.display_name || ' finished second in ' || coalesce(dv.name, 'the competition') || ' in ' || v_season.name || '.'
         end,
         ta.team_id, 'team',
         jsonb_build_object('teamId', ta.team_id, 'seasonId', p_season_id, 'result', ta.result, 'reward', ta.reward)
    from "TeamAwards" ta
    join "Teams" t on t.id = ta.team_id
    left join "Divisions" dv on dv.id = ta.division_id
    join "TeamPlayers" tp on tp.team_id = ta.team_id and tp.status = 'active'
   where ta.season_id = p_season_id;

  -- player awards -> the player
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select pa.player_id, 'season_award',
         case pa.result when '1' then 'Champion!' else 'Runner-up!' end,
         case pa.result
           when '1' then 'You won ' || coalesce(ci2.name, dv.name, 'the competition') || ' in ' || v_season.name || '.'
           else 'You finished second in ' || coalesce(ci2.name, dv.name, 'the competition') || ' in ' || v_season.name || '.'
         end,
         pa.player_id, 'player',
         jsonb_build_object('playerId', pa.player_id, 'seasonId', p_season_id, 'result', pa.result, 'reward', pa.reward)
    from "PlayerAwards" pa
    left join "CompetitionInstances" ci2 on ci2.id = pa.competition_instance_id
    left join "Divisions" dv on dv.id = pa.division_id
   where pa.season_id = p_season_id;

  -- promotion / relegation
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select distinct tp.player_id,
         case m.movement when 'promoted' then 'team_promoted' else 'team_relegated' end,
         case m.movement when 'promoted' then 'Promoted!' else 'Relegated' end,
         t.display_name || case m.movement when 'promoted' then ' has been promoted to ' else ' has been relegated to ' end
           || coalesce(dto.name, 'a new division') || ' for the next season.',
         m.id, 'team',
         jsonb_build_object('teamId', m.id, 'seasonId', p_season_id, 'from', m."from", 'to', m."to", 'movement', m.movement)
    from jsonb_to_recordset(v_moves) as m(id uuid, type text, "from" uuid, "to" uuid, movement text)
    join "Teams" t on t.id = m.id
    join "TeamPlayers" tp on tp.team_id = m.id and tp.status = 'active'
    left join "Divisions" dto on dto.id = m."to"
   where m.type = 'team';

  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select m.id,
         case m.movement when 'promoted' then 'team_promoted' else 'team_relegated' end,
         case m.movement when 'promoted' then 'Promoted!' else 'Relegated' end,
         case m.movement when 'promoted' then 'You have been promoted to ' else 'You have been relegated to ' end
           || coalesce(dto.name, 'a new division') || ' for the next season.',
         m.id, 'player',
         jsonb_build_object('playerId', m.id, 'seasonId', p_season_id, 'from', m."from", 'to', m."to", 'movement', m.movement)
    from jsonb_to_recordset(v_moves) as m(id uuid, type text, "from" uuid, "to" uuid, movement text)
    left join "Divisions" dto on dto.id = m."to"
   where m.type <> 'team';

  return json_build_object('success', true, 'message', 'Season marked as complete',
    'awards_issued', v_awards,
    'promoted', (select count(*) from jsonb_array_elements(v_moves) m where m->>'movement' = 'promoted'),
    'relegated', (select count(*) from jsonb_array_elements(v_moves) m where m->>'movement' = 'relegated'));
end $$;
revoke all on function public.end_season(uuid) from public, anon;
grant execute on function public.end_season(uuid) to authenticated;

-- ── 4. Division capacity when a request is accepted ─────────────────────────
do $patch$
declare v_def text := pg_get_functiondef('public.handle_join_division_request(uuid,text,uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, 'if p_action = ''approve'' then',
    E'if p_action = ''approve'' then\n    if exists (select 1 from "Divisions" d where d.id = v_dm.division_id and d.max_competitors is not null\n               and (select count(*) from "DivisionMembers" m where m.division_id = d.id and m.status = ''active'' and m.id <> v_dm.id) >= d.max_competitors) then\n      return jsonb_build_object(''success'', false, ''code'', ''division_full'', ''message'', ''This division is full. Raise its limit or choose another division first.'');\n    end if;');
  if v_new = v_def then raise exception 'handle_join_division_request patch failed'; end if;
  execute v_new;
end
$patch$;

-- any other way of activating a membership is held to the same limit (moves between divisions are not)
create or replace function public.enforce_division_capacity()
returns trigger language plpgsql as $$
declare v_max int;
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    select max_competitors into v_max from "Divisions" where id = new.division_id;
    if v_max is not null and (select count(*) from "DivisionMembers" m
                               where m.division_id = new.division_id and m.status = 'active' and m.id <> new.id) >= v_max then
      raise exception 'DIVISION_FULL' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_enforce_division_capacity on "DivisionMembers";
create trigger trg_enforce_division_capacity before insert or update of status on "DivisionMembers"
  for each row execute function public.enforce_division_capacity();

-- ── 5. Lineup eligibility: membership on the fixture date + competition rules ──
create or replace function public.was_team_member(p_team_id uuid, p_player_id uuid, p_at timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "TeamPlayers" tp
     where tp.team_id = p_team_id and tp.player_id = p_player_id
       and coalesce(tp.joined_at, '-infinity'::timestamptz) <= p_at
       and (tp.status = 'active' or (tp.status = 'left' and tp.left_at is not null and tp.left_at >= p_at)))
$$;
revoke all on function public.was_team_member(uuid, uuid, timestamptz) from public, anon;

do $patch$
declare v_def text := pg_get_functiondef('public.validate_fixture_frames(uuid,boolean,boolean)'::regprocedure); v_new text;
begin
  v_new := regexp_replace(v_def,
    'not exists \(\s*select 1 from "TeamPlayers" tp where tp\.team_id = (v_fx\.\w+) and tp\.player_id = (r\.\w+) and tp\.status = ''active''\)',
    'not public.was_team_member(\1, \2, coalesce(v_fx.date_time, now()))', 'g');
  if v_new = v_def or v_new like '%tp.status = ''active''%' then
    raise exception 'validate_fixture_frames membership patch failed';
  end if;

  v_new := replace(v_new, E'  if v_best_of is not null then',
E'  -- players must meet the competition gender and age rules (as at the fixture date)\n  if exists (\n    select 1\n      from "Results" r\n      cross join lateral unnest(array[r.home_player_1, r.home_player_2, r.away_player_1, r.away_player_2]) as x(pid)\n      join "Players" pl on pl.id = x.pid\n      join "CompetitionInstances" cix on cix.id = v_fx.competition_instance_id\n     where r.fixture_id = _fixture_id and x.pid is not null\n       and ((cix.gender is not null and cix.gender <> \'mixed\' and pl.gender is distinct from cix.gender)\n         or (cix.min_age is not null and pl.dob is not null and date_part(\'year\', age(coalesce(v_fx.date_time, now())::date, pl.dob)) < cix.min_age)\n         or (cix.max_age is not null and pl.dob is not null and date_part(\'year\', age(coalesce(v_fx.date_time, now())::date, pl.dob)) > cix.max_age))\n  ) then\n    raise exception \'A player in this result is not eligible for this competition\'\n      using errcode = \'P0001\', detail = \'ineligible_player\';\n  end if;\n\n  if v_best_of is not null then');
  if v_new not like '%ineligible_player%' then raise exception 'validate_fixture_frames eligibility patch failed'; end if;
  execute v_new;
end
$patch$;

-- ── 6. Stat rebuilds (idempotent) ───────────────────────────────────────────
create or replace function public.rebuild_player_stats(p_player_id uuid, p_season_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  fr record; v_cur int := 0; v_best int := 0; c record;
begin
  -- season row: counts
  with f as (
    select res.frame_type, res.lag_won, res.break_dish_player_1, res.break_dish_player_2,
           res.reverse_dish_player_1, res.reverse_dish_player_2,
           s.side,
           case when lower(coalesce(res.status, '')) = 'drawn' then 'draw'
                when res.winner_side is null then null
                when res.winner_side::text = s.side then 'win' else 'loss' end as outcome
      from "Results" res
      join "Fixtures" fx on fx.id = res.fixture_id
      cross join lateral (select case when res.home_player_1 = p_player_id or res.home_player_2 = p_player_id then 'home' else 'away' end as side) s
     where fx.approved is true and fx.season = p_season_id
       and p_player_id in (res.home_player_1, res.home_player_2, res.away_player_1, res.away_player_2)
  ), g as (select * from f where outcome is not null)
  select
    count(*) played,
    count(*) filter (where outcome = 'win') won, count(*) filter (where outcome = 'draw') drawn, count(*) filter (where outcome = 'loss') lost,
    count(*) filter (where side = 'home') hp, count(*) filter (where side = 'home' and outcome = 'win') hw,
    count(*) filter (where side = 'home' and outcome = 'draw') hd, count(*) filter (where side = 'home' and outcome = 'loss') hl,
    count(*) filter (where side = 'away') ap, count(*) filter (where side = 'away' and outcome = 'win') aw,
    count(*) filter (where side = 'away' and outcome = 'draw') ad, count(*) filter (where side = 'away' and outcome = 'loss') al,
    count(*) filter (where lag_won = p_player_id) lags,
    count(*) filter (where break_dish_player_1 = p_player_id or break_dish_player_2 = p_player_id) bd,
    count(*) filter (where reverse_dish_player_1 = p_player_id or reverse_dish_player_2 = p_player_id) rd,
    count(*) filter (where frame_type = 'singles') sp, count(*) filter (where frame_type = 'singles' and outcome = 'win') sw,
    count(*) filter (where frame_type = 'singles' and outcome = 'draw') sd, count(*) filter (where frame_type = 'singles' and outcome = 'loss') sl,
    count(*) filter (where frame_type = 'traditional_doubles') tp, count(*) filter (where frame_type = 'traditional_doubles' and outcome = 'win') tw,
    count(*) filter (where frame_type = 'traditional_doubles' and outcome = 'draw') td, count(*) filter (where frame_type = 'traditional_doubles' and outcome = 'loss') tl,
    count(*) filter (where frame_type = 'scotch_doubles') cp, count(*) filter (where frame_type = 'scotch_doubles' and outcome = 'win') cw,
    count(*) filter (where frame_type = 'scotch_doubles' and outcome = 'draw') cd, count(*) filter (where frame_type = 'scotch_doubles' and outcome = 'loss') cl
  into c from g;

  -- season streaks, in playing order
  for fr in
    select case when lower(coalesce(res.status, '')) = 'drawn' then 'draw'
                when res.winner_side is null then null
                when res.winner_side::text = (case when res.home_player_1 = p_player_id or res.home_player_2 = p_player_id then 'home' else 'away' end) then 'win'
                else 'loss' end as outcome
      from "Results" res join "Fixtures" fx on fx.id = res.fixture_id
     where fx.approved is true and fx.season = p_season_id
       and p_player_id in (res.home_player_1, res.home_player_2, res.away_player_1, res.away_player_2)
     order by fx.date_time nulls last, fx.id, res.frame_number nulls last, res.created_at
  loop
    if fr.outcome is null then continue; end if;
    if fr.outcome = 'win' then v_cur := v_cur + 1; v_best := greatest(v_best, v_cur); else v_cur := 0; end if;
  end loop;

  insert into "PlayerStats" as ps (
    player_id, season_id, frames_played, frames_won, frames_drawn, frames_lost,
    home_frames_played, home_frames_won, home_frames_drawn, home_frames_lost,
    away_frames_played, away_frames_won, away_frames_drawn, away_frames_lost,
    lags_won, break_dishes, reverse_dishes, current_frame_win_streak, best_frame_win_streak,
    singles_frames_played, singles_frames_won, singles_frames_drawn, singles_frames_lost,
    traditional_doubles_frames_played, traditional_doubles_frames_won, traditional_doubles_frames_drawn, traditional_doubles_frames_lost,
    scotch_doubles_frames_played, scotch_doubles_frames_won, scotch_doubles_frames_drawn, scotch_doubles_frames_lost, updated_at)
  values (
    p_player_id, p_season_id, c.played, c.won, c.drawn, c.lost, c.hp, c.hw, c.hd, c.hl, c.ap, c.aw, c.ad, c.al,
    c.lags, c.bd, c.rd, v_cur, v_best, c.sp, c.sw, c.sd, c.sl, c.tp, c.tw, c.td, c.tl, c.cp, c.cw, c.cd, c.cl, now())
  on conflict (player_id, season_id) do update set
    frames_played = excluded.frames_played, frames_won = excluded.frames_won, frames_drawn = excluded.frames_drawn, frames_lost = excluded.frames_lost,
    home_frames_played = excluded.home_frames_played, home_frames_won = excluded.home_frames_won, home_frames_drawn = excluded.home_frames_drawn, home_frames_lost = excluded.home_frames_lost,
    away_frames_played = excluded.away_frames_played, away_frames_won = excluded.away_frames_won, away_frames_drawn = excluded.away_frames_drawn, away_frames_lost = excluded.away_frames_lost,
    lags_won = excluded.lags_won, break_dishes = excluded.break_dishes, reverse_dishes = excluded.reverse_dishes,
    current_frame_win_streak = excluded.current_frame_win_streak, best_frame_win_streak = excluded.best_frame_win_streak,
    singles_frames_played = excluded.singles_frames_played, singles_frames_won = excluded.singles_frames_won, singles_frames_drawn = excluded.singles_frames_drawn, singles_frames_lost = excluded.singles_frames_lost,
    traditional_doubles_frames_played = excluded.traditional_doubles_frames_played, traditional_doubles_frames_won = excluded.traditional_doubles_frames_won,
    traditional_doubles_frames_drawn = excluded.traditional_doubles_frames_drawn, traditional_doubles_frames_lost = excluded.traditional_doubles_frames_lost,
    scotch_doubles_frames_played = excluded.scotch_doubles_frames_played, scotch_doubles_frames_won = excluded.scotch_doubles_frames_won,
    scotch_doubles_frames_drawn = excluded.scotch_doubles_frames_drawn, scotch_doubles_frames_lost = excluded.scotch_doubles_frames_lost,
    updated_at = now();

  -- career streaks, across every season
  v_cur := 0; v_best := 0;
  for fr in
    select case when lower(coalesce(res.status, '')) = 'drawn' then 'draw'
                when res.winner_side is null then null
                when res.winner_side::text = (case when res.home_player_1 = p_player_id or res.home_player_2 = p_player_id then 'home' else 'away' end) then 'win'
                else 'loss' end as outcome
      from "Results" res join "Fixtures" fx on fx.id = res.fixture_id
     where fx.approved is true
       and p_player_id in (res.home_player_1, res.home_player_2, res.away_player_1, res.away_player_2)
     order by fx.date_time nulls last, fx.id, res.frame_number nulls last, res.created_at
  loop
    if fr.outcome is null then continue; end if;
    if fr.outcome = 'win' then v_cur := v_cur + 1; v_best := greatest(v_best, v_cur); else v_cur := 0; end if;
  end loop;
  update "Players" set current_frame_win_streak = v_cur, best_frame_win_streak = v_best where id = p_player_id;
end $$;
revoke all on function public.rebuild_player_stats(uuid, uuid) from public, anon, authenticated;

-- approving a fixture now rebuilds (rather than adds to) the players' stats, so a re-approval after a
-- correction can never double count
create or replace function public.update_player_stats_for_fixture(p_fixture_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_season_id uuid; v_player_id uuid; v_n int := 0;
begin
  if p_fixture_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_input', 'message', 'fixture_id is required');
  end if;
  select season into v_season_id from "Fixtures" where id = p_fixture_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Fixture not found');
  end if;
  if v_season_id is null then
    return jsonb_build_object('success', false, 'code', 'no_season', 'message', 'Fixture has no season assigned; cannot attribute per-season stats');
  end if;

  for v_player_id in
    select distinct pid from (
      select home_player_1 as pid from "Results" where fixture_id = p_fixture_id
      union select home_player_2 from "Results" where fixture_id = p_fixture_id
      union select away_player_1 from "Results" where fixture_id = p_fixture_id
      union select away_player_2 from "Results" where fixture_id = p_fixture_id
    ) p where pid is not null
  loop
    perform public.rebuild_player_stats(v_player_id, v_season_id);
    perform public.check_player_badges(v_player_id);
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('success', true, 'code', 'stats_updated', 'message', 'Player stats updated for fixture',
                            'fixture_id', p_fixture_id, 'season_id', v_season_id, 'players_updated', v_n);
end $$;

-- ── 7. Admin tools: recalculate and correct ─────────────────────────────────
create or replace function public.recalculate_stats(p_district_id uuid, p_season_id uuid default null, p_player_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_n int := 0; v_p int := 0; v_last uuid;
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  for r in
    select distinct pid, sid from (
      select x.pid, fx.season as sid
        from "Fixtures" fx join "Seasons" s on s.id = fx.season and s.district = p_district_id
        join "Results" res on res.fixture_id = fx.id
        cross join lateral unnest(array[res.home_player_1, res.home_player_2, res.away_player_1, res.away_player_2]) x(pid)
       where fx.approved is true and x.pid is not null
      union
      select ps.player_id, ps.season_id from "PlayerStats" ps join "Seasons" s on s.id = ps.season_id and s.district = p_district_id
    ) q
    where (p_season_id is null or sid = p_season_id) and (p_player_id is null or pid = p_player_id)
    order by pid
  loop
    perform public.rebuild_player_stats(r.pid, r.sid);
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('success', true, 'rows_rebuilt', v_n,
    'note', 'League tables are calculated live from approved fixtures, so they are always current.');
end $$;
revoke all on function public.recalculate_stats(uuid, uuid, uuid) from public, anon;
grant execute on function public.recalculate_stats(uuid, uuid, uuid) to authenticated;

create or replace function public.recalculate_badges(p_district_id uuid, p_player_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_n int := 0;
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  for r in
    select distinct ps.player_id from "PlayerStats" ps join "Seasons" s on s.id = ps.season_id and s.district = p_district_id
     where p_player_id is null or ps.player_id = p_player_id
  loop
    perform public.check_player_badges(r.player_id);
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('success', true, 'players_checked', v_n);
end $$;
revoke all on function public.recalculate_badges(uuid, uuid) from public, anon;
grant execute on function public.recalculate_badges(uuid, uuid) to authenticated;

-- Reopen an approved result so it can be corrected and approved again. Stats are rebuilt straight away
-- (without the fixture) and again when it is re-approved. Not possible once the stage/competition finished.
create or replace function public.admin_reopen_fixture(p_fixture_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_fx "Fixtures"%rowtype; v_player uuid;
begin
  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'fixture_not_found', 'message', 'Fixture not found');
  end if;
  if not public.is_fixture_admin(p_fixture_id) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_fx.approved is not true then
    return jsonb_build_object('success', false, 'code', 'not_approved', 'message', 'This result is not approved');
  end if;
  if v_fx.is_forfeited then
    return jsonb_build_object('success', false, 'code', 'forfeit', 'message', 'Forfeits and walkovers cannot be reopened');
  end if;
  if exists (select 1 from "CompetitionInstances" where id = v_fx.competition_instance_id and status = 'completed') then
    return jsonb_build_object('success', false, 'code', 'competition_completed', 'message', 'The competition has finished');
  end if;
  if v_fx.stage_id is not null and exists (select 1 from "Stages" where id = v_fx.stage_id and status = 'completed') then
    return jsonb_build_object('success', false, 'code', 'stage_completed', 'message', 'This round has already been progressed');
  end if;

  update "Fixtures"
     set approved = false, approved_at = null, approved_by = null, is_disputed = false, is_escalated = false,
         results_version = results_version + 1, updated_at = now()
   where id = p_fixture_id;

  if v_fx.season is not null then
    for v_player in
      select distinct pid from (
        select home_player_1 as pid from "Results" where fixture_id = p_fixture_id
        union select home_player_2 from "Results" where fixture_id = p_fixture_id
        union select away_player_1 from "Results" where fixture_id = p_fixture_id
        union select away_player_2 from "Results" where fixture_id = p_fixture_id) p where pid is not null
    loop
      perform public.rebuild_player_stats(v_player, v_fx.season);
    end loop;
  end if;

  return jsonb_build_object('success', true, 'message', 'Result reopened. Edit the frames, then approve it again.');
end $$;
revoke all on function public.admin_reopen_fixture(uuid) from public, anon;
grant execute on function public.admin_reopen_fixture(uuid) to authenticated;

-- ── 8. Admins can set a team's captain ──────────────────────────────────────
do $patch$
declare v_def text := pg_get_functiondef('public.transfer_captaincy(uuid,uuid)'::regprocedure); v_new text;
begin
  v_new := regexp_replace(v_def,
    'if not exists \(\s*select 1 from "TeamPlayers" tp\s+where tp\.team_id = p_team_id\s+and tp\.player_id = public\.current_player_id\(\)',
    'if not public.is_district_admin((select district from "Teams" where id = p_team_id)) and not exists (select 1 from "TeamPlayers" tp where tp.team_id = p_team_id and tp.player_id = public.current_player_id()');
  v_new := replace(v_new, 'Only the team captain can do this', 'Only the team captain or a league admin can do this');
  if v_new = v_def or v_new not like '%is_district_admin%' then raise exception 'transfer_captaincy patch failed'; end if;
  execute v_new;
end
$patch$;
