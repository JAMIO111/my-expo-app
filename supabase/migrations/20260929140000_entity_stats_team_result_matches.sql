-- Match results use the TEAM result (option B), and forfeits count.
--
-- Previously a player's "match" was won or lost by that player's own frames in
-- the fixture. Now, for players and teams alike, a match is won / drawn / lost
-- according to the team result of the fixture:
--   * forfeited fixture: the stored winner (loss for the team that forfeited,
--     win for the other team);
--   * otherwise: whichever side won more frames across the whole fixture
--     (equal = draw).
-- A player's matches are still the fixtures they played at least one frame in.
-- A team's matches additionally include forfeited fixtures that have no frames
-- (when no frame-type filter is applied).
create or replace function public.get_entity_stats_filtered(
  _entity_type text,
  _entity_id uuid,
  _season_ids uuid[] default null,
  _competition_ids uuid[] default null,
  _frame_type text default null,
  _venue text default null
)
returns json
language plpgsql
stable
as $function$
declare
  result json;
begin
  if _entity_type not in ('player', 'team') then
    raise exception 'Invalid entity type: %', _entity_type;
  end if;

  with base as (
    select
      r.fixture_id,
      r.frame_number,
      r.winner_side::text as winner_side,
      r.bonus_frame,
      r.lag_won,
      r.break_dish_player_1,
      r.break_dish_player_2,
      r.reverse_dish_player_1,
      r.reverse_dish_player_2,
      r.home_player_1,
      r.home_player_2,
      r.away_player_1,
      r.away_player_2,
      f.date_time,
      f.season as season_id,
      coalesce(f.is_neutral_venue, false) as is_neutral,
      ci.competition_id,
      case
        when _entity_type = 'player' then
          case
            when _entity_id in (r.home_player_1, r.home_player_2) then 'home'
            when _entity_id in (r.away_player_1, r.away_player_2) then 'away'
          end
        else
          case
            when f.home_team = _entity_id then 'home'
            when f.away_team = _entity_id then 'away'
          end
      end as side,
      coalesce(
        nullif(r.frame_type, ''),
        case
          when r.home_player_2 is not null or r.away_player_2 is not null then 'doubles'
          else 'singles'
        end
      ) as frame_kind
    from public."Results" r
    join public."Fixtures" f on f.id = r.fixture_id
    left join public."CompetitionInstances" ci on ci.id = f.competition_instance_id
    where (
      (
        _entity_type = 'player'
        and f.approved = true
        and _entity_id in (r.home_player_1, r.home_player_2, r.away_player_1, r.away_player_2)
      )
      or (
        _entity_type = 'team'
        and _entity_id in (f.home_team, f.away_team)
      )
    )
  ),

  filtered as (
    select
      b.*,
      case when b.side = 'home' then b.home_player_1 else b.away_player_1 end as own_player_1,
      case when b.side = 'home' then b.home_player_2 else b.away_player_2 end as own_player_2,
      case
        when b.winner_side is null then 'draw'
        when b.winner_side = b.side then 'win'
        else 'loss'
      end as outcome
    from base b
    where b.side is not null
      and (coalesce(cardinality(_season_ids), 0) = 0 or b.season_id = any(_season_ids))
      and (
        coalesce(cardinality(_competition_ids), 0) = 0
        or b.competition_id = any(_competition_ids)
      )
      and (
        _frame_type is null
        or case _frame_type
          when 'singles' then b.frame_kind = 'singles'
          when 'doubles' then b.frame_kind in ('doubles', 'standard-doubles')
          when 'scotch-doubles' then b.frame_kind = 'scotch-doubles'
          else false
        end
      )
      and (
        _venue is null
        or case _venue
          when 'neutral' then b.is_neutral
          when 'home' then (not b.is_neutral and b.side = 'home')
          when 'away' then (not b.is_neutral and b.side = 'away')
          else false
        end
      )
  ),

  frame_seq as (
    select
      outcome,
      row_number() over (order by date_time, fixture_id, frame_number) as rn
    from filtered
  ),

  frame_win_runs as (
    select count(*) as len
    from (
      select rn - row_number() over (order by rn) as grp
      from frame_seq
      where outcome = 'win'
    ) w
    group by grp
  ),

  frame_current as (
    select count(*) as len
    from frame_seq
    where rn > coalesce((select max(rn) from frame_seq where outcome <> 'win'), 0)
  ),

  -- Frames won by each side across the WHOLE fixture (not just this entity's
  -- frames), used to work out the team result of non-forfeited fixtures.
  fixture_frame_counts as (
    select
      r.fixture_id,
      count(*) filter (where r.winner_side::text = 'home') as home_frames,
      count(*) filter (where r.winner_side::text = 'away') as away_frames
    from public."Results" r
    where r.fixture_id in (select fixture_id from filtered)
    group by r.fixture_id
  ),

  -- Fixtures the entity took part in: any fixture with at least one of its
  -- (filtered) frames...
  played_fixtures as (
    select
      fixture_id,
      min(date_time) as date_time,
      max(side) as side
    from filtered
    group by fixture_id
  ),

  -- ...plus, for teams only, forfeited fixtures with no frames at all (a
  -- forfeit is a loss for the team that forfeited and a win for the other).
  -- Only when no frame-type filter is set, since there are no frames to match.
  forfeit_only_fixtures as (
    select
      fx.id as fixture_id,
      fx.date_time,
      case when fx.home_team = _entity_id then 'home' else 'away' end as side
    from public."Fixtures" fx
    left join public."CompetitionInstances" fci on fci.id = fx.competition_instance_id
    where _entity_type = 'team'
      and _frame_type is null
      and fx.is_forfeited = true
      and _entity_id in (fx.home_team, fx.away_team)
      and fx.id not in (select fixture_id from filtered)
      and (coalesce(cardinality(_season_ids), 0) = 0 or fx.season = any(_season_ids))
      and (
        coalesce(cardinality(_competition_ids), 0) = 0
        or fci.competition_id = any(_competition_ids)
      )
      and (
        _venue is null
        or case _venue
          when 'neutral' then coalesce(fx.is_neutral_venue, false)
          when 'home' then (not coalesce(fx.is_neutral_venue, false) and fx.home_team = _entity_id)
          when 'away' then (not coalesce(fx.is_neutral_venue, false) and fx.away_team = _entity_id)
          else false
        end
      )
  ),

  -- The result of each match is the TEAM result: the stored winner for a
  -- forfeit, otherwise whichever side won more frames (equal = draw).
  match_results as (
    select
      m.fixture_id,
      m.date_time,
      case
        when fx.is_forfeited and fx.winner_side is not null then
          case when fx.winner_side::text = m.side then 'win' else 'loss' end
        when coalesce(fc.home_frames, 0) = coalesce(fc.away_frames, 0) then 'draw'
        when (coalesce(fc.home_frames, 0) > coalesce(fc.away_frames, 0)) = (m.side = 'home')
          then 'win'
        else 'loss'
      end as outcome
    from (
      select fixture_id, date_time, side from played_fixtures
      union all
      select fixture_id, date_time, side from forfeit_only_fixtures
    ) m
    join public."Fixtures" fx on fx.id = m.fixture_id
    left join fixture_frame_counts fc on fc.fixture_id = m.fixture_id
  ),

  match_seq as (
    select
      outcome,
      row_number() over (order by date_time, fixture_id) as rn
    from match_results
  ),

  match_win_runs as (
    select count(*) as len
    from (
      select rn - row_number() over (order by rn) as grp
      from match_seq
      where outcome = 'win'
    ) w
    group by grp
  ),

  match_current as (
    select count(*) as len
    from match_seq
    where rn > coalesce((select max(rn) from match_seq where outcome <> 'win'), 0)
  ),

  frame_totals as (
    select
      count(*) as frames_played,
      count(*) filter (where outcome = 'win') as frames_won,
      count(*) filter (where outcome = 'loss') as frames_lost,
      count(*) filter (where outcome = 'draw') as frames_drawn,
      count(*) filter (where bonus_frame) as bonus_frames,
      -- Player: lags / dishes credited to that player. Team: any lag or dish
      -- credited to a player on the team's side of the frame (counted once per frame).
      count(*) filter (
        where (_entity_type = 'player' and lag_won = _entity_id)
           or (_entity_type = 'team' and lag_won in (own_player_1, own_player_2))
      ) as lags_won,
      count(*) filter (
        where outcome = 'win'
          and (
            (_entity_type = 'player' and _entity_id in (break_dish_player_1, break_dish_player_2))
            or (
              _entity_type = 'team'
              and (
                break_dish_player_1 in (own_player_1, own_player_2)
                or break_dish_player_2 in (own_player_1, own_player_2)
              )
            )
          )
      ) as break_dishes,
      count(*) filter (
        where outcome = 'win'
          and (
            (_entity_type = 'player' and _entity_id in (reverse_dish_player_1, reverse_dish_player_2))
            or (
              _entity_type = 'team'
              and (
                reverse_dish_player_1 in (own_player_1, own_player_2)
                or reverse_dish_player_2 in (own_player_1, own_player_2)
              )
            )
          )
      ) as reverse_dishes
    from filtered
  ),

  match_totals as (
    select
      count(*) as matches_played,
      count(*) filter (where outcome = 'win') as matches_won,
      count(*) filter (where outcome = 'loss') as matches_lost,
      count(*) filter (where outcome = 'draw') as matches_drawn
    from match_seq
  )

  select json_build_object(
    'totalStats', json_build_object(
      'frames_played', ft.frames_played,
      'frames_won', ft.frames_won,
      'frames_lost', ft.frames_lost,
      'frames_drawn', ft.frames_drawn,
      'bonus_frames', ft.bonus_frames,
      'matches_played', mt.matches_played,
      'matches_won', mt.matches_won,
      'matches_lost', mt.matches_lost,
      'matches_drawn', mt.matches_drawn,
      'lags_won', ft.lags_won,
      'break_dishes', ft.break_dishes,
      'reverse_dishes', ft.reverse_dishes,
      'best_frame_streak', coalesce((select max(len) from frame_win_runs), 0),
      'current_frame_streak', (select len from frame_current),
      'best_match_streak', coalesce((select max(len) from match_win_runs), 0),
      'current_match_streak', (select len from match_current)
    )
  )
  into result
  from frame_totals ft
  cross join match_totals mt;

  return result;
end;
$function$;
