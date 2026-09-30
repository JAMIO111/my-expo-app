-- Badge engine.
-- * Career stats come from the aggregate tables (PlayerStats summed across seasons, streaks on
--   Players, awards counted from PlayerAwards), never from Results.
-- * check_player_badges inserts one BadgesUnlocked row per newly reached tier and adds that
--   tier's xp to Players.xp, for every tier unlocked (not just the highest).
-- * It runs after each fixture's stats are updated, and when a PlayerAwards row is added.

-- ── data fixes ──────────────────────────────────────────────────────────────
-- xp per tier follows a curve scaled by how hard the badge is:
--   xp = difficulty * 100 * 1.7^(tier-1), rounded to the nearest 25.
update "Badges" b
set meta_data = (
  select jsonb_agg(
    jsonb_set(t, '{xp}',
      to_jsonb((round(d.mult * 100 * power(1.7, (t->>'tier')::int - 1) / 25) * 25)::int))
    order by (t->>'tier')::int)
  from jsonb_array_elements(b.meta_data) t)
from (values
  ('fortress', 1.0), ('away-day-demo', 1.0), ('diehard', 1.0),
  ('deadeye', 1.5),
  ('conqueror', 2.0), ('guardian', 2.0), ('mr-reliable', 2.0),
  ('hot-hand', 2.5),
  ('cup-collector', 3.0), ('rack-attack', 3.0),
  ('rack-reaper', 4.0)
) as d(key, mult)
where b.key = d.key;

-- cup-collector used the old { stat, value } shape: move it to conditions
update "Badges" b
set meta_data = (
  select jsonb_agg(
    (t - 'requirement') || jsonb_build_object('requirement', jsonb_build_object(
      'context', 'career',
      'conditions', jsonb_build_array(jsonb_build_object(
        'stat', 'awards_earned',
        'value', (t->'requirement'->>'value')::int,
        'operator', '>='))))
    order by (t->>'tier')::int)
  from jsonb_array_elements(b.meta_data) t)
where b.key = 'cup-collector';

-- deadeye VII description was copied from cup-collector
update "Badges" b
set meta_data = (
  select jsonb_agg(
    case when t->>'tier' = '7' then jsonb_set(t, '{description}', '"Win 500 lags."') else t end
    order by (t->>'tier')::int)
  from jsonb_array_elements(b.meta_data) t)
where b.key = 'deadeye';

-- ── stats + evaluation ──────────────────────────────────────────────────────
create or replace function public.player_career_stats(p_player_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(to_jsonb(agg), '{}'::jsonb)
         || jsonb_build_object(
              'current_frame_win_streak', coalesce(p.current_frame_win_streak, 0),
              'best_frame_win_streak', coalesce(p.best_frame_win_streak, 0),
              'awards_earned', (select count(*) from "PlayerAwards" a
                                where a.player_id = p_player_id and a.result in ('1', '2')))
  from "Players" p
  left join lateral (
    select
      sum(frames_played) as frames_played, sum(frames_won) as frames_won,
      sum(frames_drawn) as frames_drawn, sum(frames_lost) as frames_lost,
      sum(home_frames_played) as home_frames_played, sum(home_frames_won) as home_frames_won,
      sum(home_frames_drawn) as home_frames_drawn, sum(home_frames_lost) as home_frames_lost,
      sum(away_frames_played) as away_frames_played, sum(away_frames_won) as away_frames_won,
      sum(away_frames_drawn) as away_frames_drawn, sum(away_frames_lost) as away_frames_lost,
      sum(lags_won) as lags_won, sum(break_dishes) as break_dishes, sum(reverse_dishes) as reverse_dishes,
      sum(singles_frames_played) as singles_frames_played, sum(singles_frames_won) as singles_frames_won,
      sum(singles_frames_drawn) as singles_frames_drawn, sum(singles_frames_lost) as singles_frames_lost,
      sum(traditional_doubles_frames_played) as traditional_doubles_frames_played,
      sum(traditional_doubles_frames_won) as traditional_doubles_frames_won,
      sum(traditional_doubles_frames_drawn) as traditional_doubles_frames_drawn,
      sum(traditional_doubles_frames_lost) as traditional_doubles_frames_lost,
      sum(scotch_doubles_frames_played) as scotch_doubles_frames_played,
      sum(scotch_doubles_frames_won) as scotch_doubles_frames_won,
      sum(scotch_doubles_frames_drawn) as scotch_doubles_frames_drawn,
      sum(scotch_doubles_frames_lost) as scotch_doubles_frames_lost
    from "PlayerStats" where player_id = p_player_id
  ) agg on true
  where p.id = p_player_id
$$;
revoke all on function public.player_career_stats(uuid) from public, anon, authenticated;

-- a requirement without conditions can never count as met (old-shape badges)
create or replace function public.evaluate_badge_requirement(p_stats jsonb, p_requirement jsonb)
returns jsonb language plpgsql set search_path = public as $$
declare
  v_condition jsonb;
  v_result jsonb;
  v_all_met boolean := true;
  v_conditions jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_requirement -> 'conditions') is distinct from 'array'
     or jsonb_array_length(p_requirement -> 'conditions') = 0 then
    return jsonb_build_object('met', false, 'conditions', '[]'::jsonb);
  end if;

  for v_condition in select * from jsonb_array_elements(p_requirement -> 'conditions')
  loop
    v_result := public.evaluate_stat_condition(p_stats, v_condition);
    v_conditions := v_conditions || jsonb_build_array(
      jsonb_build_object(
        'stat', coalesce(v_condition ->> 'stat', (v_condition ->> 'numerator') || '_per_' || (v_condition ->> 'denominator')),
        'met', v_result -> 'met',
        'current', v_result -> 'current',
        'target', v_result -> 'target'));
    if not (v_result ->> 'met')::boolean then
      v_all_met := false;
    end if;
  end loop;

  return jsonb_build_object('met', v_all_met, 'conditions', v_conditions);
end;
$$;

-- badge screen: career stats now include awards_earned
create or replace function public.get_player_badges(p_player_id uuid, p_season_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_career_stats jsonb;
  v_season_stats jsonb;
begin
  v_career_stats := coalesce(public.player_career_stats(p_player_id), '{}'::jsonb);

  select coalesce(to_jsonb(ps), '{}'::jsonb)
    into v_season_stats
    from "PlayerStats" ps
    where ps.player_id = p_player_id
      and ps.season_id = p_season_id;
  v_season_stats := coalesce(v_season_stats, '{}'::jsonb);

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'key', b.key,
          'tierCount', b.tiers,
          'tiers', (
            select jsonb_agg(
              tier || jsonb_build_object(
                'progress', public.evaluate_badge_requirement(
                  case when (tier -> 'requirement' ->> 'context') = 'season'
                       then v_season_stats
                       else v_career_stats
                  end,
                  tier -> 'requirement'))
              order by (tier ->> 'tier')::int)
            from jsonb_array_elements(b.meta_data) as tier),
          'unlockedBadges', coalesce(
            (
              select jsonb_agg(
                jsonb_build_object('tier', ub.tier, 'unlocked_at', ub.unlocked_at)
                order by ub.tier)
              from "BadgesUnlocked" ub
              where ub.badge_id = b.id and ub.player_id = p_player_id),
            '[]'::jsonb))
        order by b.id)
      from "Badges" b
      where b.is_active = true),
    '[]'::jsonb);
end;
$$;

-- ── the check ───────────────────────────────────────────────────────────────
drop function if exists public.check_player_badges(uuid);

create function public.check_player_badges(_player_id uuid)
returns table(out_badge_key text, out_tier smallint, out_xp integer)
language plpgsql security definer set search_path = public as $$
declare
  v_stats jsonb;
  b record;
  t jsonb;
  v_tier smallint;
  v_xp integer;
  v_total integer := 0;
  v_rows integer;
begin
  if not exists (select 1 from "Players" where id = _player_id) then
    return;
  end if;

  v_stats := public.player_career_stats(_player_id);

  for b in select id, key, meta_data from "Badges" where is_active = true loop
    for t in
      select e.value from jsonb_array_elements(b.meta_data) e order by (e.value ->> 'tier')::int
    loop
      -- only career requirements written with conditions are evaluated
      if coalesce(t -> 'requirement' ->> 'context', 'career') <> 'career'
         or jsonb_typeof(t -> 'requirement' -> 'conditions') is distinct from 'array' then
        continue;
      end if;

      if (public.evaluate_badge_requirement(v_stats, t -> 'requirement') ->> 'met')::boolean then
        v_tier := (t ->> 'tier')::smallint;

        insert into "BadgesUnlocked" (badge_id, player_id, tier)
        values (b.id, _player_id, v_tier)
        on conflict (player_id, badge_id, tier) do nothing;
        get diagnostics v_rows = row_count;

        if v_rows > 0 then
          v_xp := coalesce((t ->> 'xp')::integer, 0);
          v_total := v_total + v_xp;
          out_badge_key := b.key;
          out_tier := v_tier;
          out_xp := v_xp;
          return next;
        end if;
      end if;
    end loop;
  end loop;

  if v_total > 0 then
    update "Players" set xp = coalesce(xp, 0) + v_total where id = _player_id;
  end if;
end;
$$;
revoke all on function public.check_player_badges(uuid) from public, anon, authenticated;

-- ── callers ─────────────────────────────────────────────────────────────────
-- after a fixture's stats are written for a player (approve + admin resolve both go through this)
do $patch$
declare v_def text; v_new text;
begin
  v_def := pg_get_functiondef('public.update_player_stats_for_fixture(uuid)'::regprocedure);
  v_new := replace(v_def, 'v_players_updated := v_players_updated + 1;',
    E'perform public.check_player_badges(v_player_id);\n\n    v_players_updated := v_players_updated + 1;');
  if v_new = v_def then raise exception 'update_player_stats_for_fixture patch failed'; end if;
  execute v_new;
end
$patch$;

-- awards (cup-collector)
create or replace function public.trg_check_badges_on_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.player_id is not null then
    perform public.check_player_badges(new.player_id);
  end if;
  return new;
end;
$$;
revoke all on function public.trg_check_badges_on_award() from public, anon, authenticated;

drop trigger if exists trg_check_badges_on_award on "PlayerAwards";
create trigger trg_check_badges_on_award after insert on "PlayerAwards"
  for each row execute function public.trg_check_badges_on_award();

-- ── reset + backfill ────────────────────────────────────────────────────────
delete from "BadgesUnlocked";
select public.check_player_badges(id) from "Players";
