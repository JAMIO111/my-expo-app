-- Stats must only be calculated from frames in fixtures that have been approved.
--
-- These functions read Results without checking Fixtures.approved, so frames
-- from fixtures still awaiting approval (or in dispute) leaked into team stats,
-- leaderboards, recent form, the player frame history and the team side of the
-- entity stats page. Each patch below adds an `approved = true` condition to the
-- existing definition in place (so nothing else about the functions changes).
-- A patch aborts the whole migration unless its text matches exactly once.
do $migration$
declare
  patch record;
  def text;
  matches int;
begin
  for patch in
    select * from (values
      -- get_team_stats: team frames + relevant fixtures
      ('get_team_stats',
        'where _team_id in (f.home_team, f.away_team)',
        'where f.approved = true and _team_id in (f.home_team, f.away_team)'),
      ('get_team_stats',
        'where _team_id in (home_team, away_team)',
        'where approved = true and _team_id in (home_team, away_team)'),
      -- leaderboards
      ('get_player_leaderboard',
        'where s.district = _district_id',
        'where s.district = _district_id and f.approved = true'),
      ('get_team_leaderboard',
        'where s.district = _district_id',
        'where s.district = _district_id and f.approved = true'),
      -- recent form (frames and matches)
      ('get_last_5_results',
        'and r.winner_side is not null',
        'and r.winner_side is not null and f.approved = true'),
      ('get_last_5_results',
        'group by f.id, f.date_time, f.home_team, f.away_team, f.home_player, f.away_player',
        'and f.approved = true group by f.id, f.date_time, f.home_team, f.away_team, f.home_player, f.away_player'),
      -- player frame history (frames page + profile Recent Frames)
      ('get_player_frames',
        'AND r.frame_number IS NOT NULL',
        'AND r.frame_number IS NOT NULL AND f.approved = true'),
      -- entity stats: team branch (player branch already required approval)
      ('get_entity_stats_filtered',
        'and _entity_id in (f.home_team, f.away_team)',
        'and f.approved = true and _entity_id in (f.home_team, f.away_team)'),
      ('get_entity_stats_filtered',
        'and fx.is_forfeited = true',
        'and fx.is_forfeited = true and fx.approved = true'),
      ('get_entity_filter_options',
        'and _entity_id in (f.home_team, f.away_team)',
        'and f.approved = true and _entity_id in (f.home_team, f.away_team)')
    ) as t(fn, find, repl)
  loop
    select pg_get_functiondef(p.oid) into def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = patch.fn;

    if def is null then
      raise exception 'function % not found', patch.fn;
    end if;

    matches := (length(def) - length(replace(def, patch.find, ''))) / length(patch.find);
    if matches <> 1 then
      raise exception 'expected exactly 1 match in % for "%", found %', patch.fn, patch.find, matches;
    end if;

    execute replace(def, patch.find, patch.repl);
  end loop;
end
$migration$;
