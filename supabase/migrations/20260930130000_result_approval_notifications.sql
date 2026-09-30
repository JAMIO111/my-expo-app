-- Result approval chain notifications (category: My Fixtures)
--
--   result_submitted   home submits frames        -> away competitors
--   result_disputed    away disputes the result   -> home competitors
--   result_amended     home amends after dispute  -> away competitors
--   result_escalated   away rejects the amendment -> both sides
--   result_approved    result finally approved    -> both sides
--   fixture_forfeited  fixture forfeited          -> both sides
--   result_submission_reminder  fixture started but no result submitted -> home
--                               competitors, 3h and 24h after the start time
--
-- Recipients: individual fixtures -> the player; team fixtures -> the active
-- captain and vice captain of the team. Driven by a trigger on the Fixtures
-- state flags, so it works whichever RPC / client update sets them. Delivery
-- still passes through the notification preferences trigger.

alter table public."FixtureReminders" drop constraint if exists "FixtureReminders_kind_check";
alter table public."FixtureReminders"
  add constraint "FixtureReminders_kind_check"
  check (kind in ('24h', '2h', 'submit_3h', 'submit_24h'));

insert into public."NotificationTypeCategories" (type, category) values
  ('result_submitted', 'my_fixtures'),
  ('result_disputed', 'my_fixtures'),
  ('result_amended', 'my_fixtures'),
  ('result_escalated', 'my_fixtures'),
  ('result_approved', 'my_fixtures'),
  ('fixture_forfeited', 'my_fixtures'),
  ('result_submission_reminder', 'my_fixtures')
on conflict (type) do nothing;

-- People who act for one side: the player (individual) or captain / vice captain (team).
create or replace function public.fixture_side_recipients(_fixture_id uuid, _side text)
returns table (player_id uuid)
language sql
stable
security definer
set search_path = public
as $function$
  select distinct x.player_id from (
    select tp.player_id
    from "Fixtures" f
    join "TeamPlayers" tp
      on tp.team_id = case when _side = 'home' then f.home_team else f.away_team end
     and tp.status = 'active'
     and tp.role in ('captain', 'vice_captain')
    where f.id = _fixture_id and f.competitor_type = 'team'

    union all

    select case when _side = 'home' then f.home_player else f.away_player end
    from "Fixtures" f
    where f.id = _fixture_id and f.competitor_type = 'individual'
  ) x
  where x.player_id is not null;
$function$;

create or replace function public.fixture_display_names(_fixture_id uuid)
returns table (home_name text, away_name text)
language sql
stable
security definer
set search_path = public
as $function$
  select
    case when f.competitor_type = 'team' then ht.display_name else hp.first_name || ' ' || hp.surname end,
    case when f.competitor_type = 'team' then at.display_name else ap.first_name || ' ' || ap.surname end
  from "Fixtures" f
  left join "Teams" ht on ht.id = f.home_team
  left join "Teams" at on at.id = f.away_team
  left join "Players" hp on hp.id = f.home_player
  left join "Players" ap on ap.id = f.away_player
  where f.id = _fixture_id;
$function$;

create or replace function public.send_fixture_notification(
  _fixture_id uuid,
  _sides text[],
  _type text,
  _title text,
  _message text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  select distinct r.player_id, _type, _title, _message, _fixture_id, 'fixture',
         jsonb_build_object('link', '/home/' || _fixture_id, 'fixtureId', _fixture_id)
  from unnest(_sides) s(side)
  cross join lateral fixture_side_recipients(_fixture_id, s.side) r;
end;
$function$;

create or replace function public.notify_fixture_result_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_home text;
  v_away text;
  v_hf integer;
  v_af integer;
  v_score text;
  v_forfeiter text;
begin
  select n.home_name, n.away_name into v_home, v_away from fixture_display_names(new.id) n;

  select count(*) filter (where winner_side::text = 'home'),
         count(*) filter (where winner_side::text = 'away')
    into v_hf, v_af
  from "Results" where fixture_id = new.id;
  v_score := format('%s-%s', coalesce(new.home_score, v_hf), coalesce(new.away_score, v_af));

  begin
    if new.is_forfeited and not old.is_forfeited then
      v_forfeiter := case new.winner_side::text
        when 'home' then v_away
        when 'away' then v_home
      end;
      perform send_fixture_notification(new.id, array['home', 'away'], 'fixture_forfeited',
        'Fixture forfeited',
        case when v_forfeiter is null
          then format('%s v %s has been forfeited.', v_home, v_away)
          else format('%s v %s: %s forfeited.', v_home, v_away, v_forfeiter)
        end);

    elsif new.is_forfeited then
      null; -- no further result notifications on a forfeited fixture

    elsif new.approved and not old.approved then
      perform send_fixture_notification(new.id, array['home', 'away'], 'result_approved',
        'Result approved',
        format('%s v %s (%s) has been approved.', v_home, v_away, v_score));

    elsif new.is_escalated and not old.is_escalated then
      perform send_fixture_notification(new.id, array['home', 'away'], 'result_escalated',
        'Result escalated',
        format('%s v %s has been escalated for a decision.', v_home, v_away));

    elsif new.is_amended and not old.is_amended then
      perform send_fixture_notification(new.id, array['away'], 'result_amended',
        'Result amended',
        format('%s amended the result of %s v %s (%s). Please review it.', v_home, v_home, v_away, v_score));

    elsif new.is_disputed and not old.is_disputed then
      perform send_fixture_notification(new.id, array['home'], 'result_disputed',
        'Result disputed',
        format('%s disputed the result of %s v %s.', v_away, v_home, v_away));

    elsif new.is_complete and not old.is_complete then
      perform send_fixture_notification(new.id, array['away'], 'result_submitted',
        'Result submitted',
        format('%s v %s (%s) has been submitted. Please approve or dispute it.', v_home, v_away, v_score));
    end if;
  exception when others then
    -- Never block a fixture update because a notification failed.
    raise warning 'result notification failed for %: %', new.id, sqlerrm;
  end;

  return null;
end;
$function$;

create trigger trg_notify_fixture_result_progress
  after update of is_complete, is_disputed, is_amended, is_escalated, approved, is_forfeited
  on public."Fixtures"
  for each row
  when (
    old.is_complete is distinct from new.is_complete
    or old.is_disputed is distinct from new.is_disputed
    or old.is_amended is distinct from new.is_amended
    or old.is_escalated is distinct from new.is_escalated
    or old.approved is distinct from new.approved
    or old.is_forfeited is distinct from new.is_forfeited
  )
  execute function public.notify_fixture_result_progress();

-- Nudges the home side to submit the result when a fixture has started but no
-- result is in: once 3 hours after the start time, and again after 24 hours.
-- Each is sent within a grace window (so a missed run still catches it) and
-- never twice. Returns how many notifications were created.
create or replace function public.send_result_submission_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_kind  record;
  v_sent  integer;
  v_total integer := 0;
begin
  for v_kind in
    select * from (
      values
        ('submit_3h',  interval '3 hours',  interval '3 hours'),
        ('submit_24h', interval '24 hours', interval '6 hours')
    ) as k(kind, after_start, grace_time)
  loop
    with due as (
      select f.id
      from "Fixtures" f
      where f.date_time is not null
        and f.is_complete is not true
        and f.approved is not true
        and f.is_forfeited is not true
        and now() >= f.date_time + v_kind.after_start
        and now() <  f.date_time + v_kind.after_start + v_kind.grace_time
        and not exists (
          select 1 from "FixtureReminders" r
          where r.fixture_id = f.id and r.kind = v_kind.kind
        )
    ),
    claimed as (
      insert into "FixtureReminders" (fixture_id, kind)
      select id, v_kind.kind from due
      on conflict do nothing
      returning fixture_id
    )
    insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
    select
      r.player_id,
      'result_submission_reminder',
      'Submit your result',
      format('%s v %s has been played. Please submit the result.', n.home_name, n.away_name),
      c.fixture_id,
      'fixture',
      jsonb_build_object('link', '/home/' || c.fixture_id, 'fixtureId', c.fixture_id, 'reminder', v_kind.kind)
    from claimed c
    cross join lateral fixture_display_names(c.fixture_id) n
    cross join lateral fixture_side_recipients(c.fixture_id, 'home') r;

    get diagnostics v_sent = row_count;
    v_total := v_total + v_sent;
  end loop;

  return v_total;
end;
$function$;

revoke all on function public.fixture_side_recipients(uuid, text) from public, anon, authenticated;
revoke all on function public.fixture_display_names(uuid) from public, anon, authenticated;
revoke all on function public.send_fixture_notification(uuid, text[], text, text, text) from public, anon, authenticated;
revoke all on function public.send_result_submission_reminders() from public, anon, authenticated;

select cron.schedule(
  'send-result-submission-reminders',
  '*/15 * * * *',
  $$select public.send_result_submission_reminders();$$
);
