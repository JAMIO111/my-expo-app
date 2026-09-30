-- Secure the fixture approval chain.
--
-- Until now "Fixtures" and "Results" had an "Authenticated write access" policy
-- (using true), so any signed-in user could edit any fixture / frame directly,
-- and several SECURITY DEFINER functions trusted client-supplied values (the
-- approver id, an "admin" flag) or performed no authorisation at all.
--
-- After this migration:
--   * Direct writes to Fixtures / Results are limited to the admins of the
--     fixture's district (competition, division or season district). Everyone
--     else writes only through the RPCs below.
--   * Every RPC in the chain checks the caller against the fixture:
--
--       save_fixture_results   home captain / vice captain (or the home player),
--                              while the fixture is still open
--       update_disputed_frames away leader, once, on a submitted result
--       amend_result           home leader, on a disputed result
--       escalate_fixture       home leader (after a dispute) or away leader
--                              (after an amendment)      -- new, replaces the
--                              two client-side Fixtures updates
--       approve_fixture_results away leader, unless disputed / escalated, in
--                              which case an admin
--       forfeit_fixture        a leader of either side, or an admin
--       update_fixture_schedule a leader of either side, or an admin
--
--     A "leader" is the active captain / vice captain of the team, or the
--     player themselves in an individual fixture. Admins can act on any stage.
--   * The approver is always the caller (p_approved_by is kept for
--     compatibility but ignored) and forfeit_fixture works out admin status
--     itself instead of trusting p_admin.
--   * Frame ids passed to the RPCs must belong to the fixture being edited.

-- ── Identity helpers ─────────────────────────────────────────────────────────

create or replace function public.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $function$
  select p.id
  from "Players" p
  where p.auth_id = auth.uid()
    and coalesce(p.is_deleted, false) = false
  limit 1;
$function$;

create or replace function public.fixture_district(_competition_instance_id uuid, _division uuid, _season uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce(
    (select c.district_id
       from "CompetitionInstances" ci
       join "Competitions" c on c.id = ci.competition_id
      where ci.id = _competition_instance_id),
    (select d.district from "Divisions" d where d.id = _division),
    (select s.district from "Seasons" s where s.id = _season)
  );
$function$;

create or replace function public.is_district_admin(_district_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select _district_id is not null and exists (
    select 1
    from "DistrictAdmins" da
    where da.district_id = _district_id
      and da.user_id = public.current_player_id()
  );
$function$;

create or replace function public.is_fixture_admin(_fixture_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce((
    select public.is_district_admin(
      public.fixture_district(f.competition_instance_id, f.division, f.season)
    )
    from "Fixtures" f
    where f.id = _fixture_id
  ), false);
$function$;

-- Is the caller the player / captain / vice captain for one side of the fixture?
create or replace function public.is_fixture_leader(_fixture_id uuid, _side text)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.fixture_side_recipients(_fixture_id, _side) r
    where r.player_id = public.current_player_id()
  );
$function$;

-- ── Direct table access: admins only ─────────────────────────────────────────

drop policy if exists "Authenticated write access" on public."Fixtures";
drop policy if exists "Authenticated write access" on public."Results";

create policy "District admins insert fixtures" on public."Fixtures"
  for insert to authenticated
  with check (public.is_district_admin(public.fixture_district(competition_instance_id, division, season)));

create policy "District admins update fixtures" on public."Fixtures"
  for update to authenticated
  using (public.is_district_admin(public.fixture_district(competition_instance_id, division, season)))
  with check (public.is_district_admin(public.fixture_district(competition_instance_id, division, season)));

create policy "District admins delete fixtures" on public."Fixtures"
  for delete to authenticated
  using (public.is_district_admin(public.fixture_district(competition_instance_id, division, season)));

create policy "District admins insert results" on public."Results"
  for insert to authenticated
  with check (public.is_fixture_admin(fixture_id));

create policy "District admins update results" on public."Results"
  for update to authenticated
  using (public.is_fixture_admin(fixture_id))
  with check (public.is_fixture_admin(fixture_id));

create policy "District admins delete results" on public."Results"
  for delete to authenticated
  using (public.is_fixture_admin(fixture_id));

revoke insert, update, delete, truncate on public."Fixtures" from anon;
revoke insert, update, delete, truncate on public."Results" from anon;

-- ── save_fixture_results: home leader, fixture still open ────────────────────

create or replace function public.save_fixture_results(
  _fixture_id uuid,
  _frames jsonb,
  _deleted_ids uuid[],
  _submit boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_fx            "Fixtures"%rowtype;
  v_admin         boolean;
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
    raise exception 'Fixture not found' using errcode = 'P0002';
  end if;

  v_admin := public.is_fixture_admin(_fixture_id);
  if not (v_admin or public.is_fixture_leader(_fixture_id, 'home')) then
    raise exception 'Not authorised to submit results for this fixture' using errcode = '42501';
  end if;
  if v_fx.approved or v_fx.is_forfeited then
    raise exception 'This fixture is closed and its results cannot be changed' using errcode = 'P0001';
  end if;
  if v_fx.is_complete and not v_admin then
    raise exception 'Results have already been submitted for this fixture' using errcode = 'P0001';
  end if;

  -- ── 1. Delete removed frames (this fixture's only) ────────────────────────
  delete from public."Results"
  where id = any(_deleted_ids)
    and fixture_id = _fixture_id;

  -- ── 2. Offset all surviving frame_numbers for this fixture ────────────────
  -- Reordering can create a transient collision, so bump everything out of the
  -- way before writing the final numbers in step 3.
  update public."Results"
  set    frame_number = frame_number + 10000
  where  fixture_id = _fixture_id;

  -- ── 3. Upsert frames with correct order ───────────────────────────────────
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
        raise exception 'Frame % does not belong to this fixture', _frame ->> 'id' using errcode = 'P0001';
      end if;
    end if;
  end loop;

  -- ── 4. Mark fixture complete if submitting (not just saving a draft) ──────
  if _submit then
    update public."Fixtures"
    set is_complete = true,
        updated_at  = now()
    where id = _fixture_id;
  end if;
end;
$function$;

-- ── update_disputed_frames: away leader, submitted result ────────────────────

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
    raise exception 'Fixture not found' using errcode = 'P0002';
  end if;

  if not (public.is_fixture_admin(p_fixture_id) or public.is_fixture_leader(p_fixture_id, 'away')) then
    raise exception 'Not authorised to dispute this result' using errcode = '42501';
  end if;
  if not v_fx.is_complete or v_fx.approved or v_fx.is_forfeited or v_fx.is_disputed then
    raise exception 'This result cannot be disputed' using errcode = 'P0001';
  end if;

  update "Results" r
  set status = 'disputed',
      comment = f.comment
  from jsonb_to_recordset(p_frames) as f(id uuid, comment text)
  where r.id = f.id
    and r.fixture_id = p_fixture_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Select at least one frame to dispute' using errcode = 'P0001';
  end if;

  update "Fixtures"
  set is_disputed = true,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── amend_result: home leader, disputed result ───────────────────────────────

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
    raise exception 'Fixture not found' using errcode = 'P0002';
  end if;

  if not (public.is_fixture_admin(amend_result.fixture_id)
          or public.is_fixture_leader(amend_result.fixture_id, 'home')) then
    raise exception 'Not authorised to amend this result' using errcode = '42501';
  end if;
  if not v_fx.is_disputed or v_fx.is_amended or v_fx.is_escalated
     or v_fx.approved or v_fx.is_forfeited then
    raise exception 'This result cannot be amended' using errcode = 'P0001';
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
      updated_at = now()
  where id = amend_result.fixture_id;
end;
$function$;

-- ── escalate_fixture: replaces the two client-side is_escalated updates ──────
--   home leader after a dispute (refuting it), away leader after an amendment
--   (rejecting it), or an admin.

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
    raise exception 'Fixture not found' using errcode = 'P0002';
  end if;

  if not v_fx.is_disputed or v_fx.approved or v_fx.is_escalated or v_fx.is_forfeited then
    raise exception 'This result cannot be escalated' using errcode = 'P0001';
  end if;

  if not (
    public.is_fixture_admin(p_fixture_id)
    or (not v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'home'))
    or (v_fx.is_amended and public.is_fixture_leader(p_fixture_id, 'away'))
  ) then
    raise exception 'Not authorised to escalate this result' using errcode = '42501';
  end if;

  update "Fixtures"
  set is_escalated = true,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;

-- ── approve_fixture_results: away leader (admin if disputed / escalated) ─────

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
  v_stats_result jsonb;
begin
  if p_fixture_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_input', 'message', 'fixture_id is required');
  end if;

  select * into v_fx from "Fixtures" where id = p_fixture_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Fixture not found');
  end if;

  if v_fx.approved then
    return jsonb_build_object('success', false, 'code', 'already_approved', 'message', 'Fixture has already been approved');
  end if;

  v_admin := public.is_fixture_admin(p_fixture_id);

  if v_fx.is_forfeited then
    v_allowed := v_admin
      or public.is_fixture_leader(p_fixture_id, 'home')
      or public.is_fixture_leader(p_fixture_id, 'away');
  elsif not v_fx.is_complete then
    return jsonb_build_object('success', false, 'code', 'not_submitted', 'message', 'Results have not been submitted yet');
  elsif v_fx.is_escalated or (v_fx.is_disputed and not v_fx.is_amended) then
    -- Waiting on an amendment / an admin decision: the opponent cannot approve.
    v_allowed := v_admin;
  else
    v_allowed := v_admin or public.is_fixture_leader(p_fixture_id, 'away');
  end if;

  if not v_allowed then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'message', 'You are not allowed to approve this result');
  end if;

  v_approver := public.current_player_id();

  update "Fixtures"
  set approved = true,
      approved_at = now(),
      approved_by = v_approver
  where id = p_fixture_id;

  -- Runs in the same transaction as the approval above: if this fails,
  -- the approve update is rolled back too, so a fixture can never end up
  -- approved without its stats applied (or vice versa).
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

-- ── forfeit_fixture: leader of either side or admin; admin worked out here ───

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
  v_approver_id uuid;
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
  -- p_admin only ever narrows: the caller must genuinely be an admin.
  v_as_admin := coalesce(p_admin, false) and v_is_admin;

  if v_fixture.approved = true or v_fixture.is_forfeited = true then
    return jsonb_build_object('success', false, 'error', 'FIXTURE_NOT_FORFEITABLE');
  end if;

  -- Resolve best_of: Stages first, fallback to CompetitionInstances
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

  -- Award all remaining frames to the non-forfeiting side
  if p_side = 'home' then
    v_home_score := v_home_wins;
    v_away_score := v_away_wins + v_remaining;
  else
    v_home_score := v_home_wins + v_remaining;
    v_away_score := v_away_wins;
  end if;

  if v_as_admin then
    v_approver_id := public.current_player_id();
  end if;

  update "Fixtures"
  set
    forfeit_reason = trim(p_reason),
    updated_at = now(),
    winner_side = (case when p_side = 'home' then 'away' else 'home' end)::frame_side,
    is_forfeited = true,
    home_score = v_home_score,
    away_score = v_away_score,
    approved = case when v_as_admin then true else approved end,
    approved_at = case when v_as_admin then now() else approved_at end,
    approved_by = case when v_as_admin then v_approver_id else approved_by end
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

-- ── update_fixture_schedule: leader of either side or admin ──────────────────

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
  select * into v_fixture from "Fixtures" where id = p_fixture_id;

  if not found then
    raise exception 'Fixture % not found', p_fixture_id using errcode = 'P0002';
  end if;

  if not (public.is_fixture_admin(p_fixture_id)
          or public.is_fixture_leader(p_fixture_id, 'home')
          or public.is_fixture_leader(p_fixture_id, 'away')) then
    raise exception 'Not authorised to reschedule this fixture' using errcode = '42501';
  end if;

  if v_fixture.approved then
    raise exception 'Fixture % is already approved and cannot be rescheduled', p_fixture_id
      using errcode = 'P0001';
  end if;

  if v_fixture.is_complete and v_fixture.is_disputed then
    raise exception 'Fixture % is disputed and requires admin intervention before changes', p_fixture_id
      using errcode = 'P0001';
  end if;

  if p_venue_id is not null then
    if not exists (select 1 from "Addresses" where id = p_venue_id) then
      raise exception 'Venue % does not exist', p_venue_id using errcode = 'P0002';
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

-- ── Function privileges ──────────────────────────────────────────────────────
-- The RPCs are for signed-in users only. The helpers used by RLS policies must
-- be executable by authenticated. Stats and recipient helpers are internal.

revoke all on function public.current_player_id() from public, anon;
revoke all on function public.fixture_district(uuid, uuid, uuid) from public, anon;
revoke all on function public.is_district_admin(uuid) from public, anon;
revoke all on function public.is_fixture_admin(uuid) from public, anon;
revoke all on function public.is_fixture_leader(uuid, text) from public, anon;
grant execute on function public.current_player_id() to authenticated;
grant execute on function public.fixture_district(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_district_admin(uuid) to authenticated;
grant execute on function public.is_fixture_admin(uuid) to authenticated;
grant execute on function public.is_fixture_leader(uuid, text) to authenticated;

revoke all on function public.save_fixture_results(uuid, jsonb, uuid[], boolean) from public, anon;
revoke all on function public.update_disputed_frames(uuid, jsonb) from public, anon;
revoke all on function public.amend_result(uuid, jsonb) from public, anon;
revoke all on function public.escalate_fixture(uuid) from public, anon;
revoke all on function public.approve_fixture_results(uuid, uuid) from public, anon;
revoke all on function public.forfeit_fixture(uuid, text, text, boolean) from public, anon;
revoke all on function public.update_fixture_schedule(uuid, timestamptz, uuid) from public, anon;
grant execute on function public.save_fixture_results(uuid, jsonb, uuid[], boolean) to authenticated;
grant execute on function public.update_disputed_frames(uuid, jsonb) to authenticated;
grant execute on function public.amend_result(uuid, jsonb) to authenticated;
grant execute on function public.escalate_fixture(uuid) to authenticated;
grant execute on function public.approve_fixture_results(uuid, uuid) to authenticated;
grant execute on function public.forfeit_fixture(uuid, text, text, boolean) to authenticated;
grant execute on function public.update_fixture_schedule(uuid, timestamptz, uuid) to authenticated;

-- Only approve_fixture_results (as owner) should ever apply a fixture's stats.
revoke all on function public.update_player_stats_for_fixture(uuid) from public, anon, authenticated;
