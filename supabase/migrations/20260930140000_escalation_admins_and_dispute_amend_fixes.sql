-- 1. Escalation also notifies the admins of the fixture's district.
-- 2. Fix amend_result: it referenced columns that do not exist (break_dish,
--    reverse_dish), assigned text to the uuid lag_won and ignored the second
--    dish players, bonus frame and frame type the app sends.
-- 3. Fix update_disputed_frames: it took an integer fixture id and integer frame
--    ids (both are uuids) and set a Results.updated_at column that does not
--    exist, so disputing could never succeed.

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
      insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
      select distinct da.user_id, 'result_escalated', 'Result escalated',
             format('%s v %s has been escalated and needs an admin decision.', v_home, v_away),
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


create or replace function public.amend_result(fixture_id uuid, frames jsonb)
returns void
language plpgsql
as $function$
begin
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
    and r.fixture_id = amend_result.fixture_id;

  update "Fixtures"
  set approved = false,
      is_disputed = true,
      is_amended = true,
      updated_at = now()
  where id = amend_result.fixture_id;
end;
$function$;

drop function if exists public.update_disputed_frames(integer, jsonb);

create or replace function public.update_disputed_frames(p_fixture_id uuid, p_frames jsonb)
returns void
language plpgsql
as $function$
begin
  update "Results" r
  set status = 'disputed',
      comment = f.comment
  from jsonb_to_recordset(p_frames) as f(id uuid, comment text)
  where r.id = f.id
    and r.fixture_id = p_fixture_id;

  update "Fixtures"
  set is_disputed = true,
      updated_at = now()
  where id = p_fixture_id;
end;
$function$;
