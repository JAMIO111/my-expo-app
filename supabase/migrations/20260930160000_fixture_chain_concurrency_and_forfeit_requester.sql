-- Fixture approval chain: concurrency safety, machine-readable errors and
-- forfeit requesters.
--
-- Captains AND vice captains can now act on the same fixture, so two people can
-- race each other. Every RPC already locks the fixture row (select ... for
-- update) and re-checks its state under the lock, so a race can only ever have
-- one winner; this migration makes the loser's failure explicit:
--
--   * every state conflict raises P0001 with a stable code in the error DETAIL
--     (already_submitted, already_disputed, already_amended, already_escalated,
--     already_approved, fixture_forfeited, not_submitted, not_disputed,
--     fixture_changed, frame_mismatch, no_frames_selected, disputed_locked,
--     not_authorised) so the app can show the right toast;
--   * approve_fixture_results / forfeit_fixture return the same codes in their
--     JSON result;
--   * fixture results carry a version ("results_version"). save_fixture_results
--     takes the version the editor loaded and rejects the save with
--     fixture_changed if the results were changed by someone else in the
--     meantime (two leaders editing the same draft would otherwise duplicate
--     or clobber each other's frames). It returns the new version.
--
-- It also records who requested a forfeit (forfeit_requested_by) so that the
-- forfeit has to be approved by the OTHER side (or an admin).

alter table public."Fixtures"
  add column if not exists results_version integer not null default 0,
  add column if not exists forfeit_requested_by uuid references public."Players"(id) on update cascade on delete set null;

-- ── Leader helpers ───────────────────────────────────────────────────────────

create or replace function public.player_is_fixture_leader(_fixture_id uuid, _side text, _player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select _player_id is not null and exists (
    select 1
    from public.fixture_side_recipients(_fixture_id, _side) r
    where r.player_id = _player_id
  );
$function$;

create or replace function public.is_fixture_leader(_fixture_id uuid, _side text)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select public.player_is_fixture_leader(_fixture_id, _side, public.current_player_id());
$function$;

revoke all on function public.player_is_fixture_leader(uuid, text, uuid) from public, anon, authenticated;

-- ── save_fixture_results: versioned, coded errors ────────────────────────────

drop function if exists public.save_fixture_results(uuid, jsonb, uuid[], boolean);

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
  v_fx            "Fixtures"%rowtype;
  v_admin         boolean;
  v_version       integer;
  _frame          jsonb;
  _frame_number   smallint;
  _home_player_1  uuid;
  _home_player_2  uuid;
  _away_player_1  uuid;
  _away_player_2  uuid;
  _winner_side    frame_side;
  _break_dish_1   uuid;
  _break_dish_2   uuid;
  _reverse_dish_1 uuid;
  _reverse_dish_2 uuid;
  _lag_won        uuid;
  _bonus_frame    boolean;
  _frame_type     text;
  _status         text;
  _rows           integer;
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
  if v_fx.is_complete and not v_admin then
    raise exception 'Results have already been submitted for this fixture'
      using errcode = 'P0001', detail = 'already_submitted';
  end if;
  if _expected_version is not null and _expected_version <> v_fx.results_version then
    raise exception 'These results were changed by someone else'
      using errcode = 'P0001', detail = 'fixture_changed';
  end if;

  delete from public."Results"
  where id = any(_deleted_ids)
    and fixture_id = _fixture_id;

  update public."Results"
  set    frame_number = frame_number + 10000
  where  fixture_id = _fixture_id;

  for _frame in select * from jsonb_array_elements(_frames)
  loop
    _home_player_1  := (_frame ->> 'homePlayer1')::uuid;
    _home_player_2  := (_frame ->> 'homePlayer2')::uuid;
    _away_player_1  := (_frame ->> 'awayPlayer1')::uuid;
    _away_player_2  := (_frame ->> 'awayPlayer2')::uuid;
    _winner_side    := (_frame ->> 'winnerSide')::frame_side;
    _frame_number   := (_frame ->> 'frameNumber')::smallint;
    _break_dish_1   := (_frame ->> 'breakDish1')::uuid;
    _break_dish_2   := (_frame ->> 'breakDish2')::uuid;
    _reverse_dish_1 := (_frame ->> 'reverseDish1')::uuid;
    _reverse_dish_2 := (_frame ->> 'reverseDish2')::uuid;
    _lag_won        := (_frame ->> 'lagWon')::uuid;
    _bonus_frame    := (_frame ->> 'bonusFrame')::boolean;
    _frame_type     := _frame ->> 'frameType';
    _status         := (_frame ->> 'status')::text;

    if (_frame ->> 'id') is null then
      insert into public."Results" (
        fixture_id,
        home_player_1, home_player_2,
        away_player_1, away_player_2,
        frame_number,
        winner_side,
        break_dish_player_1, break_dish_player_2,
        reverse_dish_player_1, reverse_dish_player_2,
        lag_won,
        bonus_frame,
        frame_type,
        status
      ) values (
        _fixture_id,
        _home_player_1, _home_player_2,
        _away_player_1, _away_player_2,
        _frame_number,
        _winner_side,
        _break_dish_1, _break_dish_2,
        _reverse_dish_1, _reverse_dish_2,
        _lag_won,
        _bonus_frame,
        _frame_type,
        _status
      );
    else
      update public."Results"
      set home_player_1          = _home_player_1,
          home_player_2          = _home_player_2,
          away_player_1          = _away_player_1,
          away_player_2          = _away_player_2,
          winner_side            = _winner_side,
          frame_number           = _frame_number,
          break_dish_player_1    = _break_dish_1,
          break_dish_player_2    = _break_dish_2,
          reverse_dish_player_1  = _reverse_dish_1,
          reverse_dish_player_2  = _reverse_dish_2,
          lag_won                = _lag_won,
          bonus_frame            = _bonus_frame,
          frame_type             = _frame_type
      where id = (_frame ->> 'id')::uuid
        and fixture_id = _fixture_id;

      get diagnostics _rows = row_count;
      if _rows = 0 then
        -- Deleted by someone else, or not this fixture's frame at all.
        raise exception 'A frame in your list no longer exists'
          using errcode = 'P0001', detail = 'frame_mismatch';
      end if;
    end if;
  end loop;

  update public."Fixtures"
  set results_version = results_version + 1,
      is_complete = case when _submit then true else is_complete end,
      updated_at  = case when _submit then now() else updated_at end
  where id = _fixture_id
  returning results_version into v_version;

  return v_version;
end;
$function$;

-- ── update_disputed_frames ───────────────────────────────────────────────────

create or replace function public.update_disputed_frames(p_fixture_id uuid, p_frames jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx   "Fixtures"%rowtype;
  v_rows integer;
begin
  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  if not (public.is_fixture_admin(p_fixture_id) or public.is_fixture_leader(p_fixture_id, 'away')) then
    raise exception 'Not authorised to dispute this result' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_fx.approved then
    raise exception 'This result has already been approved' using errcode = 'P0001', detail = 'already_approved';
  elsif v_fx.is_forfeited then
    raise exception 'This fixture has been forfeited' using errcode = 'P0001', detail = 'fixture_forfeited';
  elsif not v_fx.is_complete then
    raise exception 'Results have not been submitted yet' using errcode = 'P0001', detail = 'not_submitted';
  elsif v_fx.is_disputed then
    raise exception 'This result has already been disputed' using errcode = 'P0001', detail = 'already_disputed';
  end if;

  update "Results" r
  set status = 'disputed',
      comment = f.comment
  from jsonb_to_recordset(p_frames) as f(id uuid, comment text)
  where r.id = f.id
    and r.fixture_id = p_fixture_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Select at least one frame to dispute'
      using errcode = 'P0001', detail = 'no_frames_selected';
  end if;

  update "Fixtures"
  set is_disputed = true,
      results_version = results_version + 1,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── amend_result ─────────────────────────────────────────────────────────────

create or replace function public.amend_result(fixture_id uuid, frames jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx "Fixtures"%rowtype;
begin
  select * into v_fx from "Fixtures" where id = amend_result.fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  if not (public.is_fixture_admin(amend_result.fixture_id)
          or public.is_fixture_leader(amend_result.fixture_id, 'home')) then
    raise exception 'Not authorised to amend this result' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_fx.approved then
    raise exception 'This result has already been approved' using errcode = 'P0001', detail = 'already_approved';
  elsif v_fx.is_forfeited then
    raise exception 'This fixture has been forfeited' using errcode = 'P0001', detail = 'fixture_forfeited';
  elsif not v_fx.is_disputed then
    raise exception 'This result is not in dispute' using errcode = 'P0001', detail = 'not_disputed';
  elsif v_fx.is_escalated then
    raise exception 'This result has already been escalated' using errcode = 'P0001', detail = 'already_escalated';
  elsif v_fx.is_amended then
    raise exception 'This result has already been amended' using errcode = 'P0001', detail = 'already_amended';
  end if;

  update "Results" r
  set
    winner_side = (f->>'winner_side')::frame_side,
    home_player_1 = (f->>'home_player_1')::uuid,
    home_player_2 = (f->>'home_player_2')::uuid,
    away_player_1 = (f->>'away_player_1')::uuid,
    away_player_2 = (f->>'away_player_2')::uuid,
    break_dish_player_1 = (f->>'break_dish_player_1')::uuid,
    break_dish_player_2 = (f->>'break_dish_player_2')::uuid,
    reverse_dish_player_1 = (f->>'reverse_dish_player_1')::uuid,
    reverse_dish_player_2 = (f->>'reverse_dish_player_2')::uuid,
    lag_won = (f->>'lag_won')::uuid,
    bonus_frame = coalesce((f->>'bonus_frame')::boolean, false),
    frame_type = f->>'frame_type',
    status = 'amended'
  from jsonb_array_elements(frames) f
  where r.id = (f->>'id')::uuid
    and r.fixture_id = amend_result.fixture_id
    and r.status = 'disputed';

  update "Fixtures"
  set approved = false,
      is_disputed = true,
      is_amended = true,
      results_version = results_version + 1,
      updated_at = now()
  where id = amend_result.fixture_id;
end;
$function$;

-- ── escalate_fixture ─────────────────────────────────────────────────────────

create or replace function public.escalate_fixture(p_fixture_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx "Fixtures"%rowtype;
begin
  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  if v_fx.approved then
    raise exception 'This result has already been approved' using errcode = 'P0001', detail = 'already_approved';
  elsif v_fx.is_forfeited then
    raise exception 'This fixture has been forfeited' using errcode = 'P0001', detail = 'fixture_forfeited';
  elsif v_fx.is_escalated then
    raise exception 'This result has already been escalated' using errcode = 'P0001', detail = 'already_escalated';
  elsif not v_fx.is_disputed then
    raise exception 'This result is not in dispute' using errcode = 'P0001', detail = 'not_disputed';
  end if;

  if not (
    public.is_fixture_admin(p_fixture_id)
    or (not v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'home'))
    or (v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'away'))
  ) then
    raise exception 'Not authorised to escalate this result' using errcode = '42501', detail = 'not_authorised';
  end if;

  update "Fixtures"
  set is_escalated = true,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── approve_fixture_results ──────────────────────────────────────────────────

create or replace function public.approve_fixture_results(p_fixture_id uuid, p_approved_by uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx           "Fixtures"%rowtype;
  v_admin        boolean;
  v_approver     uuid;
  v_allowed      boolean;
  v_deny_code    text := 'forbidden';
  v_deny_message text := 'You are not allowed to approve this result';
  v_stats_result jsonb;
begin
  if p_fixture_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_input', 'message', 'fixture_id is required');
  end if;

  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'fixture_not_found', 'message', 'Fixture not found');
  end if;

  if v_fx.approved then
    return jsonb_build_object('success', false, 'code', 'already_approved', 'message', 'Fixture has already been approved');
  end if;

  v_admin := public.is_fixture_admin(p_fixture_id);

  if v_fx.is_forfeited then
    -- The other side (or an admin) approves a forfeit, never the side that requested it.
    v_allowed := v_admin
      or (public.is_fixture_leader(p_fixture_id, 'home')
          and not public.player_is_fixture_leader(p_fixture_id, 'home', v_fx.forfeit_requested_by))
      or (public.is_fixture_leader(p_fixture_id, 'away')
          and not public.player_is_fixture_leader(p_fixture_id, 'away', v_fx.forfeit_requested_by));
    if not v_allowed
       and (public.is_fixture_leader(p_fixture_id, 'home') or public.is_fixture_leader(p_fixture_id, 'away')) then
      v_deny_code := 'awaiting_opponent';
      v_deny_message := 'The other side has to approve this forfeit';
    end if;
  elsif not v_fx.is_complete then
    return jsonb_build_object('success', false, 'code', 'not_submitted', 'message', 'Results have not been submitted yet');
  elsif v_fx.is_escalated then
    v_allowed := v_admin;
    v_deny_code := 'already_escalated';
    v_deny_message := 'This result has been escalated and needs an admin decision';
  elsif v_fx.is_disputed and not v_fx.is_amended then
    v_allowed := v_admin;
    v_deny_code := 'awaiting_amendment';
    v_deny_message := 'This result is in dispute and is waiting for an amendment';
  else
    v_allowed := v_admin or public.is_fixture_leader(p_fixture_id, 'away');
  end if;

  if not v_allowed then
    -- Only tell callers who belong to the fixture why; strangers just get "forbidden".
    if not (public.is_fixture_leader(p_fixture_id, 'home') or public.is_fixture_leader(p_fixture_id, 'away')) then
      v_deny_code := 'forbidden';
      v_deny_message := 'You are not allowed to approve this result';
    elsif v_deny_code = 'forbidden' then
      v_deny_message := 'Only the opposing side can approve this result';
    end if;
    return jsonb_build_object('success', false, 'code', v_deny_code, 'message', v_deny_message);
  end if;

  v_approver := public.current_player_id();

  update "Fixtures"
  set approved = true,
      approved_at = now(),
      approved_by = v_approver
  where id = p_fixture_id;

  v_stats_result := public.update_player_stats_for_fixture(p_fixture_id);

  if (v_stats_result->>'success')::boolean is not true then
    raise exception 'Stat update failed: %', v_stats_result->>'message';
  end if;

  return jsonb_build_object(
    'success', true,
    'code', 'fixture_approved',
    'message', 'Fixture approved and player stats updated',
    'fixture_id', p_fixture_id,
    'stats_result', v_stats_result
  );
end;
$function$;

-- ── forfeit_fixture: records the requester, specific error codes ─────────────

create or replace function public.forfeit_fixture(
  p_fixture_id uuid,
  p_side text,
  p_reason text,
  p_admin boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fixture     record;
  v_best_of     int;
  v_home_wins   int;
  v_away_wins   int;
  v_played      int;
  v_remaining   int;
  v_home_score  int;
  v_away_score  int;
  v_player_id   uuid;
  v_is_admin    boolean;
  v_as_admin    boolean;
begin
  if p_side not in ('home', 'away') then
    return jsonb_build_object('success', false, 'error', 'INVALID_SIDE');
  end if;

  select * into v_fixture from "Fixtures" where id = p_fixture_id for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'FIXTURE_NOT_FOUND');
  end if;

  v_is_admin := public.is_fixture_admin(p_fixture_id);
  if not (v_is_admin
          or public.is_fixture_leader(p_fixture_id, 'home')
          or public.is_fixture_leader(p_fixture_id, 'away')) then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;
  v_as_admin := coalesce(p_admin, false) and v_is_admin;

  if v_fixture.approved = true then
    return jsonb_build_object('success', false, 'error', 'ALREADY_APPROVED');
  end if;
  if v_fixture.is_forfeited = true then
    return jsonb_build_object('success', false, 'error', 'ALREADY_FORFEITED');
  end if;

  select s.best_of into v_best_of from "Stages" s where s.id = v_fixture.stage_id;

  if v_best_of is null then
    select ci.best_of into v_best_of
    from "CompetitionInstances" ci
    where ci.id = v_fixture.competition_instance_id;
  end if;

  if v_best_of is null then
    return jsonb_build_object('success', false, 'error', 'BEST_OF_NOT_SET');
  end if;

  select
    count(*) filter (where winner_side = 'home'),
    count(*) filter (where winner_side = 'away')
  into v_home_wins, v_away_wins
  from "Results"
  where fixture_id = p_fixture_id
    and winner_side is not null;

  v_played := v_home_wins + v_away_wins;
  v_remaining := greatest(v_best_of - v_played, 0);

  if p_side = 'home' then
    v_home_score := v_home_wins;
    v_away_score := v_away_wins + v_remaining;
  else
    v_home_score := v_home_wins + v_remaining;
    v_away_score := v_away_wins;
  end if;

  v_player_id := public.current_player_id();

  update "Fixtures"
  set
    forfeit_reason = trim(p_reason),
    forfeit_requested_by = v_player_id,
    updated_at = now(),
    winner_side = (case when p_side = 'home' then 'away' else 'home' end)::frame_side,
    is_forfeited = true,
    home_score = v_home_score,
    away_score = v_away_score,
    approved = case when v_as_admin then true else approved end,
    approved_at = case when v_as_admin then now() else approved_at end,
    approved_by = case when v_as_admin then v_player_id else approved_by end
  where id = p_fixture_id;

  return jsonb_build_object(
    'success', true,
    'home_score', v_home_score,
    'away_score', v_away_score,
    'best_of', v_best_of
  );

exception when others then
  return jsonb_build_object('success', false, 'error', 'UNEXPECTED_ERROR', 'detail', sqlerrm);
end;
$function$;

-- ── update_fixture_schedule: now serialised with the rest of the chain ───────

create or replace function public.update_fixture_schedule(
  p_fixture_id uuid,
  p_date_time timestamptz,
  p_venue_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fixture "Fixtures"%rowtype;
begin
  select * into v_fixture from "Fixtures" where id = p_fixture_id for update;

  if not found then
    raise exception 'Fixture not found' using errcode = 'P0002', detail = 'fixture_not_found';
  end if;

  if not (public.is_fixture_admin(p_fixture_id)
          or public.is_fixture_leader(p_fixture_id, 'home')
          or public.is_fixture_leader(p_fixture_id, 'away')) then
    raise exception 'Not authorised to reschedule this fixture'
      using errcode = '42501', detail = 'not_authorised';
  end if;

  if v_fixture.approved then
    raise exception 'This fixture has already been approved and cannot be rescheduled'
      using errcode = 'P0001', detail = 'already_approved';
  end if;

  if v_fixture.is_forfeited then
    raise exception 'This fixture has been forfeited and cannot be rescheduled'
      using errcode = 'P0001', detail = 'fixture_forfeited';
  end if;

  if v_fixture.is_complete and v_fixture.is_disputed then
    raise exception 'This fixture is disputed and needs an admin before it can be changed'
      using errcode = 'P0001', detail = 'disputed_locked';
  end if;

  if p_venue_id is not null then
    if not exists (select 1 from "Addresses" where id = p_venue_id) then
      raise exception 'Venue does not exist' using errcode = 'P0002', detail = 'venue_not_found';
    end if;
  end if;

  update "Fixtures"
  set
    date_time  = coalesce(p_date_time, date_time),
    venue_id   = case when p_venue_id is null then null else p_venue_id end,
    updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── Privileges (functions re-created above keep their grants; the new
--    save_fixture_results signature needs its own) ─────────────────────────────

revoke all on function public.save_fixture_results(uuid, jsonb, uuid[], boolean, integer) from public, anon;
grant execute on function public.save_fixture_results(uuid, jsonb, uuid[], boolean, integer) to authenticated;
