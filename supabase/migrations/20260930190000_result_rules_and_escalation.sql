-- Result rules, forfeit disputes, admin resolution and auto-escalation.
--
-- 1. Frame validation (validate_fixture_frames), applied on every save and on
--    amendments:
--      * players must belong to the fixture: active members of the home / away
--        team, or exactly the two players of an individual fixture
--      * no player twice in one frame; lag / dish credits go to players in the frame
--      * normal frames <= best_of and at most one bonus frame (only when the
--        competition has a special match); no limit when best_of is not set
--      * on submit: at least one frame, every frame has a winner, and the
--        fixture has started
--    Only forfeits can finish with zero frames.
-- 2. escalate_fixture: the side that did NOT request a forfeit can dispute it
--    (-> escalated to the admins).
-- 3. Admin resolution: resolve_escalated_fixture lets a district admin add /
--    edit / remove frames (or reject a forfeit and enter a played result) and
--    approve in one step; get_escalated_fixtures lists them.
-- 4. Auto-escalation: Districts.result_escalation_days (default 3) is how long
--    a result may sit with nobody acting before it is escalated to the admins;
--    a cron job checks hourly. Admins change the value with
--    set_result_escalation_days.

alter table public."Districts"
  add column if not exists result_escalation_days smallint not null default 3
  check (result_escalation_days between 1 and 30);

alter table public."Fixtures"
  add column if not exists escalation_reason text,
  add column if not exists awaiting_since timestamptz not null default now();

-- When did the fixture last change state? (drives auto-escalation)
update public."Fixtures" set awaiting_since = coalesce(updated_at, created_at, now());

create or replace function public.set_fixture_awaiting_since()
returns trigger
language plpgsql
as $function$
begin
  if new.is_complete is distinct from old.is_complete
     or new.is_disputed is distinct from old.is_disputed
     or new.is_amended is distinct from old.is_amended
     or new.is_forfeited is distinct from old.is_forfeited then
    new.awaiting_since := now();
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_set_fixture_awaiting_since on public."Fixtures";
create trigger trg_set_fixture_awaiting_since
  before update of is_complete, is_disputed, is_amended, is_forfeited on public."Fixtures"
  for each row execute function public.set_fixture_awaiting_since();

-- ── Frame validation ─────────────────────────────────────────────────────────

create or replace function public.validate_fixture_frames(
  _fixture_id uuid,
  _for_submit boolean,
  _check_start boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx      "Fixtures"%rowtype;
  v_best_of integer;
  v_special boolean;
  v_normal  integer;
  v_bonus   integer;
begin
  select * into v_fx from "Fixtures" where id = _fixture_id;

  select coalesce(s.best_of, ci.best_of), coalesce(ci.special_match, false)
    into v_best_of, v_special
  from "CompetitionInstances" ci
  left join "Stages" s on s.id = v_fx.stage_id
  where ci.id = v_fx.competition_instance_id;

  -- players belong to the fixture
  if exists (
    select 1 from "Results" r
    where r.fixture_id = _fixture_id
      and (
        case when v_fx.competitor_type = 'team' then
          (r.home_player_1 is not null and not exists (
             select 1 from "TeamPlayers" tp where tp.team_id = v_fx.home_team and tp.player_id = r.home_player_1 and tp.status = 'active'))
          or (r.home_player_2 is not null and not exists (
             select 1 from "TeamPlayers" tp where tp.team_id = v_fx.home_team and tp.player_id = r.home_player_2 and tp.status = 'active'))
          or (r.away_player_1 is not null and not exists (
             select 1 from "TeamPlayers" tp where tp.team_id = v_fx.away_team and tp.player_id = r.away_player_1 and tp.status = 'active'))
          or (r.away_player_2 is not null and not exists (
             select 1 from "TeamPlayers" tp where tp.team_id = v_fx.away_team and tp.player_id = r.away_player_2 and tp.status = 'active'))
        else
          r.home_player_1 is distinct from v_fx.home_player
          or r.away_player_1 is distinct from v_fx.away_player
          or r.home_player_2 is not null
          or r.away_player_2 is not null
        end)
  ) then
    raise exception 'A frame includes a player who is not part of this fixture'
      using errcode = 'P0001', detail = 'invalid_player';
  end if;

  -- nobody twice in one frame
  if exists (
    select 1 from "Results" r
    where r.fixture_id = _fixture_id
      and (select count(*) from unnest(array[r.home_player_1, r.home_player_2, r.away_player_1, r.away_player_2]) x where x is not null)
        <> (select count(distinct x) from unnest(array[r.home_player_1, r.home_player_2, r.away_player_1, r.away_player_2]) x where x is not null)
  ) then
    raise exception 'A player cannot appear twice in the same frame'
      using errcode = 'P0001', detail = 'duplicate_player';
  end if;

  -- lag and dish credits go to players in the frame
  if exists (
    select 1 from "Results" r
    where r.fixture_id = _fixture_id
      and exists (
        select 1 from unnest(array[r.lag_won, r.break_dish_player_1, r.break_dish_player_2, r.reverse_dish_player_1, r.reverse_dish_player_2]) c
        where c is not null
          and not coalesce(c = any(array[r.home_player_1, r.home_player_2, r.away_player_1, r.away_player_2]), false)
      )
  ) then
    raise exception 'A lag or dish is credited to a player who is not in that frame'
      using errcode = 'P0001', detail = 'invalid_player';
  end if;

  -- frame limits (none when the fixture has no best-of)
  if v_best_of is not null then
    select count(*) filter (where not coalesce(bonus_frame, false)),
           count(*) filter (where coalesce(bonus_frame, false))
      into v_normal, v_bonus
    from "Results" where fixture_id = _fixture_id;

    if v_normal > v_best_of then
      raise exception 'This fixture is a best of % - it cannot have more than % frames', v_best_of, v_best_of
        using errcode = 'P0001', detail = 'too_many_frames';
    end if;
    if v_bonus > 1 then
      raise exception 'Only one bonus frame is allowed per fixture'
        using errcode = 'P0001', detail = 'too_many_bonus_frames';
    end if;
    if v_bonus > 0 and not v_special then
      raise exception 'This competition does not have a bonus frame'
        using errcode = 'P0001', detail = 'bonus_not_allowed';
    end if;
  end if;

  if _for_submit then
    if not exists (select 1 from "Results" where fixture_id = _fixture_id) then
      raise exception 'A result needs at least one frame'
        using errcode = 'P0001', detail = 'no_frames';
    end if;
    if exists (select 1 from "Results" where fixture_id = _fixture_id and winner_side is null) then
      raise exception 'Every frame needs a winner before the result can be submitted'
        using errcode = 'P0001', detail = 'missing_winner';
    end if;
  end if;

  if _check_start and v_fx.date_time is not null and v_fx.date_time > now() then
    raise exception 'Results can only be submitted once the fixture has started'
      using errcode = 'P0001', detail = 'too_early';
  end if;
end;
$function$;

-- Shared by save_fixture_results and resolve_escalated_fixture.
create or replace function public.apply_fixture_frames(
  _fixture_id uuid,
  _frames jsonb,
  _deleted_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  _frame          jsonb;
  _rows           integer;
begin
  delete from public."Results"
  where id = any(coalesce(_deleted_ids, '{}'))
    and fixture_id = _fixture_id;

  -- Reordering can create a transient collision, so bump everything out of the
  -- way before writing the final frame numbers.
  update public."Results"
  set    frame_number = frame_number + 10000
  where  fixture_id = _fixture_id;

  for _frame in select * from jsonb_array_elements(coalesce(_frames, '[]'::jsonb))
  loop
    if (_frame ->> 'id') is null then
      insert into public."Results" (
        fixture_id,
        home_player_1, home_player_2, away_player_1, away_player_2,
        frame_number, winner_side,
        break_dish_player_1, break_dish_player_2,
        reverse_dish_player_1, reverse_dish_player_2,
        lag_won, bonus_frame, frame_type, status
      ) values (
        _fixture_id,
        (_frame ->> 'homePlayer1')::uuid, (_frame ->> 'homePlayer2')::uuid,
        (_frame ->> 'awayPlayer1')::uuid, (_frame ->> 'awayPlayer2')::uuid,
        (_frame ->> 'frameNumber')::smallint, (_frame ->> 'winnerSide')::frame_side,
        (_frame ->> 'breakDish1')::uuid, (_frame ->> 'breakDish2')::uuid,
        (_frame ->> 'reverseDish1')::uuid, (_frame ->> 'reverseDish2')::uuid,
        (_frame ->> 'lagWon')::uuid,
        coalesce((_frame ->> 'bonusFrame')::boolean, false),
        _frame ->> 'frameType',
        _frame ->> 'status'
      );
    else
      update public."Results"
      set home_player_1          = (_frame ->> 'homePlayer1')::uuid,
          home_player_2          = (_frame ->> 'homePlayer2')::uuid,
          away_player_1          = (_frame ->> 'awayPlayer1')::uuid,
          away_player_2          = (_frame ->> 'awayPlayer2')::uuid,
          winner_side            = (_frame ->> 'winnerSide')::frame_side,
          frame_number           = (_frame ->> 'frameNumber')::smallint,
          break_dish_player_1    = (_frame ->> 'breakDish1')::uuid,
          break_dish_player_2    = (_frame ->> 'breakDish2')::uuid,
          reverse_dish_player_1  = (_frame ->> 'reverseDish1')::uuid,
          reverse_dish_player_2  = (_frame ->> 'reverseDish2')::uuid,
          lag_won                = (_frame ->> 'lagWon')::uuid,
          bonus_frame            = coalesce((_frame ->> 'bonusFrame')::boolean, false),
          frame_type             = _frame ->> 'frameType'
      where id = (_frame ->> 'id')::uuid
        and fixture_id = _fixture_id;

      get diagnostics _rows = row_count;
      if _rows = 0 then
        raise exception 'A frame in your list no longer exists'
          using errcode = 'P0001', detail = 'frame_mismatch';
      end if;
    end if;
  end loop;
end;
$function$;

revoke all on function public.validate_fixture_frames(uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function public.apply_fixture_frames(uuid, jsonb, uuid[]) from public, anon, authenticated;

-- ── save_fixture_results: now validates ──────────────────────────────────────

create or replace function public.save_fixture_results(
  _fixture_id uuid,
  _frames jsonb,
  _deleted_ids uuid[],
  _submit boolean default false,
  _expected_version integer default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx      "Fixtures"%rowtype;
  v_admin   boolean;
  v_version integer;
begin
  select * into v_fx from "Fixtures" where id = _fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  v_admin := public.is_fixture_admin(_fixture_id);
  if not (v_admin or public.is_fixture_leader(_fixture_id, 'home')) then
    raise exception 'Not authorised to submit results for this fixture'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_fx.approved then
    raise exception 'This fixture has already been approved' using errcode = 'P0001', detail = 'already_approved';
  end if;
  if v_fx.is_forfeited then
    raise exception 'This fixture has been forfeited' using errcode = 'P0001', detail = 'fixture_forfeited';
  end if;
  if v_fx.is_escalated then
    raise exception 'This fixture has been escalated to the league admin' using errcode = 'P0001', detail = 'already_escalated';
  end if;
  if v_fx.is_complete and not v_admin then
    raise exception 'Results have already been submitted for this fixture'
      using errcode = 'P0001', detail = 'already_submitted';
  end if;
  if _expected_version is not null and _expected_version <> v_fx.results_version then
    raise exception 'These results were changed by someone else'
      using errcode = 'P0001', detail = 'fixture_changed';
  end if;

  perform public.apply_fixture_frames(_fixture_id, _frames, _deleted_ids);
  perform public.validate_fixture_frames(_fixture_id, _submit, _submit);

  update public."Fixtures"
  set results_version = results_version + 1,
      is_complete = case when _submit then true else is_complete end,
      updated_at  = case when _submit then now() else updated_at end
  where id = _fixture_id
  returning results_version into v_version;

  return v_version;
end;
$function$;

-- ── amend_result: amended frames are validated too ───────────────────────────

do $patch$
declare
  v_def text := pg_get_functiondef('public.amend_result(uuid,jsonb)'::regprocedure);
  v_new text;
begin
  v_new := regexp_replace(v_def, 'update "Fixtures"\s+set approved = false,',
    'perform public.validate_fixture_frames(amend_result.fixture_id, true, false);' || E'\n\n  update "Fixtures"\n  set approved = false,');
  if v_new = v_def then raise exception 'amend_result patch changed nothing'; end if;
  execute v_new;
end
$patch$;

-- ── escalate_fixture: also lets the opponent dispute a requested forfeit ─────

create or replace function public.escalate_fixture(p_fixture_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx     "Fixtures"%rowtype;
  v_reason text := 'manual';
begin
  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  if v_fx.approved then
    raise exception 'This result has already been approved' using errcode = 'P0001', detail = 'already_approved';
  elsif v_fx.is_escalated then
    raise exception 'This result has already been escalated' using errcode = 'P0001', detail = 'already_escalated';
  elsif v_fx.is_forfeited then
    -- disputing a requested forfeit: the side that did not request it (or an admin)
    if not (
      public.is_fixture_admin(p_fixture_id)
      or (public.is_fixture_leader(p_fixture_id, 'home')
          and not public.player_is_fixture_leader(p_fixture_id, 'home', v_fx.forfeit_requested_by))
      or (public.is_fixture_leader(p_fixture_id, 'away')
          and not public.player_is_fixture_leader(p_fixture_id, 'away', v_fx.forfeit_requested_by))
    ) then
      raise exception 'Not authorised to dispute this forfeit' using errcode = '42501', detail = 'not_authorised';
    end if;
    v_reason := 'forfeit_disputed';
  elsif not v_fx.is_disputed then
    raise exception 'This result is not in dispute' using errcode = 'P0001', detail = 'not_disputed';
  else
    if not (
      public.is_fixture_admin(p_fixture_id)
      or (not v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'home'))
      or (v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'away'))
    ) then
      raise exception 'Not authorised to escalate this result' using errcode = '42501', detail = 'not_authorised';
    end if;
  end if;

  update "Fixtures"
  set is_escalated = true,
      escalation_reason = v_reason,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── Admin resolution of escalated fixtures ───────────────────────────────────

create or replace function public.resolve_escalated_fixture(
  p_fixture_id uuid,
  p_frames jsonb,
  p_deleted_ids uuid[],
  p_expected_version integer default null,
  p_reject_forfeit boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx     "Fixtures"%rowtype;
  v_stats  jsonb;
  v_admin  uuid;
begin
  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;
  if not public.is_fixture_admin(p_fixture_id) then
    raise exception 'Only a league admin can resolve an escalated fixture'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_fx.approved then
    raise exception 'This fixture has already been approved' using errcode = 'P0001', detail = 'already_approved';
  end if;
  if not v_fx.is_escalated then
    raise exception 'This fixture has not been escalated' using errcode = 'P0001', detail = 'not_escalated';
  end if;
  if v_fx.is_forfeited and not p_reject_forfeit then
    raise exception 'This fixture is a forfeit - approve the forfeit or reject it first'
      using errcode = 'P0001', detail = 'fixture_forfeited';
  end if;
  if p_expected_version is not null and p_expected_version <> v_fx.results_version then
    raise exception 'These results were changed by someone else'
      using errcode = 'P0001', detail = 'fixture_changed';
  end if;

  if v_fx.is_forfeited then
    -- Rejecting the forfeit: the fixture is played out with the frames provided.
    update "Fixtures"
    set is_forfeited = false, winner_side = null, home_score = null, away_score = null,
        forfeit_reason = null, forfeit_requested_by = null
    where id = p_fixture_id;
  end if;

  perform public.apply_fixture_frames(p_fixture_id, p_frames, p_deleted_ids);
  perform public.validate_fixture_frames(p_fixture_id, true, false);

  v_admin := public.current_player_id();

  update "Fixtures"
  set results_version = results_version + 1,
      is_complete = true,
      approved = true,
      approved_at = now(),
      approved_by = v_admin,
      updated_at = now()
  where id = p_fixture_id;

  v_stats := public.update_player_stats_for_fixture(p_fixture_id);
  if (v_stats->>'success')::boolean is not true then
    raise exception 'Stat update failed: %', v_stats->>'message';
  end if;

  return jsonb_build_object('success', true, 'code', 'fixture_resolved', 'fixture_id', p_fixture_id);
end;
$function$;

create or replace function public.get_escalated_fixtures(p_district_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Not authorised' using errcode = '42501', detail = 'not_authorised';
  end if;

  return coalesce((
    select jsonb_agg(
      to_jsonb(f) || jsonb_build_object(
        'home_team', (select jsonb_build_object('display_name', t.display_name, 'crest', t.crest, 'abbreviation', t.abbreviation) from "Teams" t where t.id = f.home_team),
        'away_team', (select jsonb_build_object('display_name', t.display_name, 'crest', t.crest, 'abbreviation', t.abbreviation) from "Teams" t where t.id = f.away_team),
        'home_player', (select jsonb_build_object('id', p.id, 'first_name', p.first_name, 'surname', p.surname, 'nickname', p.nickname, 'avatar_url', p.avatar_url) from "Players" p where p.id = f.home_player),
        'away_player', (select jsonb_build_object('id', p.id, 'first_name', p.first_name, 'surname', p.surname, 'nickname', p.nickname, 'avatar_url', p.avatar_url) from "Players" p where p.id = f.away_player),
        'competition_instance', (select jsonb_build_object('id', ci.id, 'name', ci.name) from "CompetitionInstances" ci where ci.id = f.competition_instance_id)
      )
      order by f.date_time
    )
    from "Fixtures" f
    where f.is_escalated and not f.approved
      and public.fixture_district(f.competition_instance_id, f.division, f.season) = p_district_id
  ), '[]'::jsonb);
end;
$function$;

create or replace function public.set_result_escalation_days(p_district_id uuid, p_days integer)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can change this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_days is null or p_days < 1 or p_days > 30 then
    raise exception 'Choose between 1 and 30 days' using errcode = 'P0001', detail = 'invalid_days';
  end if;
  update "Districts" set result_escalation_days = p_days where id = p_district_id;
  return p_days;
end;
$function$;

-- ── Auto-escalation ──────────────────────────────────────────────────────────

create or replace function public.auto_escalate_stale_fixtures()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_count integer;
begin
  with cand as (
    select
      f.id,
      case
        when f.is_forfeited then 'forfeit_not_approved'
        when not f.is_complete then 'no_result_submitted'
        when f.is_disputed and f.is_amended then 'no_response_to_amendment'
        when f.is_disputed then 'no_amendment'
        else 'no_response_to_result'
      end as reason,
      case when not f.is_forfeited and not f.is_complete then f.date_time else f.awaiting_since end as base,
      coalesce(d.result_escalation_days, 3) as days
    from "Fixtures" f
    join "Seasons" s on s.id = f.season and s.status = 'active'
    left join "Districts" d on d.id = public.fixture_district(f.competition_instance_id, f.division, f.season)
    where not f.approved
      and not f.is_escalated
      and f.date_time is not null
      and f.date_time < now()
  )
  update "Fixtures" f
  set is_escalated = true,
      escalation_reason = c.reason,
      updated_at = now()
  from cand c
  where c.id = f.id
    and c.base + make_interval(days => c.days) <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.auto_escalate_stale_fixtures() from public, anon, authenticated;

select cron.schedule('auto-escalate-stale-fixtures', '5 * * * *', $$select public.auto_escalate_stale_fixtures();$$);

-- ── Escalation notifications explain why ─────────────────────────────────────

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
  v_days integer;
  v_reason text;
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
      if new.approved then
        perform send_fixture_notification(new.id, array['home', 'away'], 'fixture_forfeited',
          'Fixture forfeited',
          case when v_forfeiter is null
            then format('%s v %s has been forfeited.', v_home, v_away)
            else format('%s v %s: %s forfeited.', v_home, v_away, v_forfeiter)
          end);
      else
        perform send_fixture_notification(new.id, array['home', 'away'], 'fixture_forfeited',
          'Forfeit requested',
          case when v_forfeiter is null
            then format('A forfeit has been requested for %s v %s. The other side needs to approve it.', v_home, v_away)
            else format('A forfeit has been requested for %s v %s: %s forfeiting. The other side needs to approve it.', v_home, v_away, v_forfeiter)
          end);
      end if;

    elsif new.is_forfeited and new.approved and not old.approved then
      v_forfeiter := case new.winner_side::text
        when 'home' then v_away
        when 'away' then v_home
      end;
      perform send_fixture_notification(new.id, array['home', 'away'], 'result_approved',
        'Forfeit confirmed',
        case when v_forfeiter is null
          then format('The forfeit of %s v %s has been confirmed.', v_home, v_away)
          else format('%s v %s: the forfeit by %s has been confirmed.', v_home, v_away, v_forfeiter)
        end);

    elsif new.is_forfeited and not new.is_escalated then
      null;

    elsif new.approved and not old.approved then
      perform send_fixture_notification(new.id, array['home', 'away'], 'result_approved',
        'Result approved',
        format('%s v %s (%s) has been approved.', v_home, v_away, v_score));

    elsif new.is_escalated and not old.is_escalated then
      v_reason := new.escalation_reason;
      select coalesce(d.result_escalation_days, 3) into v_days
      from "Districts" d
      where d.id = public.fixture_district(new.competition_instance_id, new.division, new.season);
      v_days := coalesce(v_days, 3);

      perform send_fixture_notification(new.id, array['home', 'away'], 'result_escalated',
        'Result escalated',
        case v_reason
          when 'no_result_submitted' then format('%s v %s: no result was submitted within %s days, so it has been escalated to the league admin.', v_home, v_away, v_days)
          when 'no_response_to_result' then format('%s v %s: the submitted result was not approved or disputed within %s days, so it has been escalated to the league admin.', v_home, v_away, v_days)
          when 'no_amendment' then format('%s v %s: the dispute was not answered within %s days, so it has been escalated to the league admin.', v_home, v_away, v_days)
          when 'no_response_to_amendment' then format('%s v %s: the amended result was not answered within %s days, so it has been escalated to the league admin.', v_home, v_away, v_days)
          when 'forfeit_not_approved' then format('%s v %s: the forfeit was not approved within %s days, so it has been escalated to the league admin.', v_home, v_away, v_days)
          when 'forfeit_disputed' then format('%s v %s: the forfeit was disputed and has been escalated to the league admin.', v_home, v_away)
          else format('%s v %s has been escalated for a decision.', v_home, v_away)
        end);
      insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
      select distinct da.user_id, 'result_escalated', 'Result escalated',
             format('%s v %s needs an admin decision%s.', v_home, v_away,
               case v_reason
                 when 'no_result_submitted' then ' (no result submitted)'
                 when 'no_response_to_result' then ' (result not approved or disputed)'
                 when 'no_amendment' then ' (dispute not answered)'
                 when 'no_response_to_amendment' then ' (amendment not answered)'
                 when 'forfeit_not_approved' then ' (forfeit not approved)'
                 when 'forfeit_disputed' then ' (forfeit disputed)'
                 else ''
               end),
             new.id, 'fixture',
             jsonb_build_object('link', '/home/' || new.id, 'fixtureId', new.id)
      from "DistrictAdmins" da
      where da.district_id = (
        select coalesce(d.district, s.district)
        from "Fixtures" f
        left join "Divisions" d on d.id = f.division
        left join "Seasons" s on s.id = f.season
        where f.id = new.id
      );

    elsif new.is_forfeited then
      null;

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
    raise warning 'result notification failed for %: %', new.id, sqlerrm;
  end;

  return null;
end;
$function$;

-- The escalation columns are read by the trigger's WHEN clause only via is_escalated.

-- ── Privileges ───────────────────────────────────────────────────────────────

revoke all on function public.save_fixture_results(uuid, jsonb, uuid[], boolean, integer) from public, anon;
revoke all on function public.escalate_fixture(uuid) from public, anon;
revoke all on function public.resolve_escalated_fixture(uuid, jsonb, uuid[], integer, boolean) from public, anon;
revoke all on function public.get_escalated_fixtures(uuid) from public, anon;
revoke all on function public.set_result_escalation_days(uuid, integer) from public, anon;
grant execute on function public.save_fixture_results(uuid, jsonb, uuid[], boolean, integer) to authenticated;
grant execute on function public.escalate_fixture(uuid) to authenticated;
grant execute on function public.resolve_escalated_fixture(uuid, jsonb, uuid[], integer, boolean) to authenticated;
grant execute on function public.get_escalated_fixtures(uuid) to authenticated;
grant execute on function public.set_result_escalation_days(uuid, integer) to authenticated;
