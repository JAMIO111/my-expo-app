-- get_player_frames: show frames from ALL fixtures again, flagged by state.
--
-- The previous migration (only_count_approved_fixtures) made this history list
-- approved-only. A frame history is not a stats calculation, and people expect
-- to see frames they have just played, so this restores unapproved frames and
-- adds fixture state to every frame so the app can label them:
--
--   fixture_status        'approved' | 'escalated' | 'disputed' | 'pending' | 'in_progress'
--                         (pending = submitted and awaiting approval,
--                          in_progress = not yet submitted)
--   fixture_approved      Fixtures.approved
--   fixture_is_disputed   Fixtures.is_disputed
--   fixture_is_escalated  Fixtures.is_escalated
--   fixture_is_forfeited  Fixtures.is_forfeited
do $migration$
declare
  patch record;
  def text;
  matches int;
begin
  for patch in
    select * from (values
      ('get_player_frames',
        'AND r.frame_number IS NOT NULL AND f.approved = true',
        'AND r.frame_number IS NOT NULL'),
      ('get_player_frames',
        'r.frame_type,',
        E'r.frame_type,\n\n        -- Fixture state, so the app can flag frames that are not approved yet.\n        f.approved AS fixture_approved,\n        f.is_disputed AS fixture_is_disputed,\n        f.is_escalated AS fixture_is_escalated,\n        f.is_forfeited AS fixture_is_forfeited,\n        CASE\n            WHEN f.approved THEN ''approved''\n            WHEN f.is_escalated THEN ''escalated''\n            WHEN f.is_disputed THEN ''disputed''\n            WHEN f.is_complete THEN ''pending''\n            ELSE ''in_progress''\n        END AS fixture_status,')
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
