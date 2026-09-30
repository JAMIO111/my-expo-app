-- Fixture notifications (category: My Fixtures)
--
--   match_reminder      24 hours and 2 hours before kick-off, sent by a pg_cron job
--   fixture_rescheduled sent when an upcoming fixture's date/time changes
--
-- Recipients: active players of both teams (team fixtures) or the two players
-- (individual fixtures). Times are shown in Europe/London. Tapping a
-- notification opens the fixture (data.link = /home/<fixtureId>). Delivery
-- still goes through the notification preferences (BEFORE INSERT trigger), so
-- players who muted My Fixtures get nothing.

-- Which reminders have been sent, so a fixture is never reminded twice. Rows
-- are cleared when a fixture is rescheduled so its reminders re-arm.
create table public."FixtureReminders" (
  fixture_id  uuid not null references public."Fixtures"(id) on update cascade on delete cascade,
  kind        text not null check (kind in ('24h', '2h')),
  sent_at     timestamptz not null default now(),
  primary key (fixture_id, kind)
);
alter table public."FixtureReminders" enable row level security;

insert into public."NotificationTypeCategories" (type, category)
values ('fixture_rescheduled', 'my_fixtures')
on conflict (type) do nothing;

-- Everyone who should hear about a fixture, with their own side / opponent name.
create or replace function public.fixture_recipients(_fixture_id uuid)
returns table (player_id uuid, own_name text, opponent_name text)
language sql
stable
security definer
set search_path = public
as $function$
  select distinct on (x.player_id) x.player_id, x.own_name, x.opponent_name
  from (
    select
      tp.player_id,
      case when tp.team_id = f.home_team then home_t.display_name else away_t.display_name end as own_name,
      case when tp.team_id = f.home_team then away_t.display_name else home_t.display_name end as opponent_name
    from "Fixtures" f
    join "Teams" home_t on home_t.id = f.home_team
    join "Teams" away_t on away_t.id = f.away_team
    join "TeamPlayers" tp on tp.team_id in (f.home_team, f.away_team) and tp.status = 'active'
    where f.id = _fixture_id and f.competitor_type = 'team'

    union all

    select v.player_id, v.own_name, v.opponent_name
    from "Fixtures" f
    join "Players" hp on hp.id = f.home_player
    join "Players" ap on ap.id = f.away_player
    cross join lateral (
      values
        (f.home_player, hp.first_name || ' ' || hp.surname, ap.first_name || ' ' || ap.surname),
        (f.away_player, ap.first_name || ' ' || ap.surname, hp.first_name || ' ' || hp.surname)
    ) as v(player_id, own_name, opponent_name)
    where f.id = _fixture_id and f.competitor_type = 'individual'
  ) x
  order by x.player_id;
$function$;

-- Sends any reminder that has come due. Run every 15 minutes. A reminder is due
-- from its lead time until a grace period later (so a missed run still catches
-- it), but a fixture that was only just created or moved inside the window does
-- not get a "tomorrow" reminder late. Returns how many notifications were created.
create or replace function public.send_match_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_kind    record;
  v_sent    integer;
  v_total   integer := 0;
begin
  for v_kind in
    select * from (
      values
        ('24h', interval '24 hours', interval '2 hours'),
        ('2h',  interval '2 hours',  interval '1 hour')
    ) as k(kind, lead_time, grace_time)
  loop
    with due as (
      select f.id, f.date_time
      from "Fixtures" f
      where f.date_time > now()
        and f.is_complete is not true
        and f.approved is not true
        and f.is_forfeited is not true
        and now() >= f.date_time - v_kind.lead_time
        and now() <  f.date_time - v_kind.lead_time + v_kind.grace_time
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
      rc.player_id,
      'match_reminder',
      'Match reminder',
      case v_kind.kind
        when '24h' then format('%s play %s tomorrow at %s.',
          rc.own_name, rc.opponent_name, to_char(d.date_time at time zone 'Europe/London', 'HH24:MI'))
        else format('%s play %s in 2 hours (%s).',
          rc.own_name, rc.opponent_name, to_char(d.date_time at time zone 'Europe/London', 'HH24:MI'))
      end,
      c.fixture_id,
      'fixture',
      jsonb_build_object('link', '/home/' || c.fixture_id, 'fixtureId', c.fixture_id, 'reminder', v_kind.kind)
    from claimed c
    join due d on d.id = c.fixture_id
    cross join lateral fixture_recipients(c.fixture_id) rc;

    get diagnostics v_sent = row_count;
    v_total := v_total + v_sent;
  end loop;

  return v_total;
end;
$function$;

-- Moving a fixture re-arms its reminders and tells the players involved.
create or replace function public.notify_fixture_rescheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  delete from "FixtureReminders" where fixture_id = new.id;

  if old.date_time is not null
     and new.date_time is not null
     and new.date_time > now()
     and new.is_complete is not true
     and new.approved is not true
     and new.is_forfeited is not true
  then
    begin
      insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
      select
        rc.player_id,
        'fixture_rescheduled',
        'Fixture rescheduled',
        format('%s v %s has moved to %s at %s.',
          rc.own_name,
          rc.opponent_name,
          to_char(new.date_time at time zone 'Europe/London', 'FMDy FMDD FMMon'),
          to_char(new.date_time at time zone 'Europe/London', 'HH24:MI')),
        new.id,
        'fixture',
        jsonb_build_object(
          'link', '/home/' || new.id,
          'fixtureId', new.id,
          'oldDateTime', old.date_time,
          'newDateTime', new.date_time
        )
      from fixture_recipients(new.id) rc;
    exception when others then
      -- Never block a fixture update because a notification failed.
      raise warning 'fixture reschedule notification failed for %: %', new.id, sqlerrm;
    end;
  end if;

  return null;
end;
$function$;

create trigger trg_notify_fixture_rescheduled
  after update of date_time on public."Fixtures"
  for each row
  when (old.date_time is distinct from new.date_time)
  execute function public.notify_fixture_rescheduled();

revoke all on function public.fixture_recipients(uuid) from public, anon, authenticated;
revoke all on function public.send_match_reminders() from public, anon, authenticated;

select cron.schedule(
  'send-match-reminders',
  '*/15 * * * *',
  $$select public.send_match_reminders();$$
);
