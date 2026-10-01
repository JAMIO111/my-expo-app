-- Divisions, Seasons, Competitions, CompetitionInstances, Stages and DivisionMembers
-- had "Authenticated write access" (using true) policies, so any signed-in user
-- could rewrite any league's structure. Writes are now limited to admins of the
-- owning district, and the functions that manage these tables check the caller.

create or replace function public.division_district(p_division_id uuid)
returns uuid language sql stable security definer set search_path = public as
$$ select district from "Divisions" where id = p_division_id $$;

create or replace function public.competition_instance_district(p_instance_id uuid)
returns uuid language sql stable security definer set search_path = public as
$$
  select coalesce(c.district_id, d.district, s.district)
  from "CompetitionInstances" ci
  left join "Competitions" c on c.id = ci.competition_id
  left join "Divisions" d on d.id = ci.division_id
  left join "Seasons" s on s.id = ci.season_id
  where ci.id = p_instance_id
$$;

create or replace function public.competition_instance_row_district(p_competition_id uuid, p_division_id uuid, p_season_id uuid)
returns uuid language sql stable security definer set search_path = public as
$$
  select coalesce(
    (select district_id from "Competitions" where id = p_competition_id),
    (select district from "Divisions" where id = p_division_id),
    (select district from "Seasons" where id = p_season_id))
$$;

grant execute on function public.division_district(uuid), public.competition_instance_district(uuid),
  public.competition_instance_row_district(uuid, uuid, uuid) to authenticated;

-- ── policies ────────────────────────────────────────────────────────────────
drop policy if exists "Authenticated write access" on "Divisions";
drop policy if exists "Authenticated write access" on "Seasons";
drop policy if exists "Authenticated write access" on "Competitions";
drop policy if exists "Authenticated write access" on "CompetitionInstances";
drop policy if exists "Authenticated write access" on "Stages";
drop policy if exists "Authenticated write access" on "DivisionMembers";

create policy "District admins write" on "Divisions" for all to authenticated
  using (public.is_district_admin(district)) with check (public.is_district_admin(district));
create policy "District admins write" on "Seasons" for all to authenticated
  using (public.is_district_admin(district)) with check (public.is_district_admin(district));
create policy "District admins write" on "Competitions" for all to authenticated
  using (public.is_district_admin(district_id)) with check (public.is_district_admin(district_id));
create policy "District admins write" on "CompetitionInstances" for all to authenticated
  using (public.is_district_admin(public.competition_instance_row_district(competition_id, division_id, season_id)))
  with check (public.is_district_admin(public.competition_instance_row_district(competition_id, division_id, season_id)));
create policy "District admins write" on "Stages" for all to authenticated
  using (public.is_district_admin(public.competition_instance_district(competition_instance_id)))
  with check (public.is_district_admin(public.competition_instance_district(competition_instance_id)));
create policy "District admins write" on "DivisionMembers" for all to authenticated
  using (public.is_district_admin(public.division_district(division_id)))
  with check (public.is_district_admin(public.division_district(division_id)));

revoke insert, update, delete on "Divisions", "Seasons", "Competitions", "CompetitionInstances", "Stages", "DivisionMembers" from anon;

-- ── admin-only functions: definer + caller check ────────────────────────────
do $patch$
declare
  v_def text;
  v_new text;
  v_reg regprocedure;
  v_check text;
  v_items text[][] := array[
    array['public.generate_knockout_bracket(uuid)', 'public.competition_instance_district(p_competition_instance_id)'],
    array['public.progress_stage(uuid)', 'public.competition_instance_district(p_competition_instance_id)'],
    array['public.save_league_fixtures(uuid,jsonb)', 'public.competition_instance_district(p_competition_instance_id)']
  ];
  i int;
begin
  for i in 1..array_length(v_items, 1) loop
    v_reg := v_items[i][1]::regprocedure;
    v_check := v_items[i][2];
    v_def := pg_get_functiondef(v_reg);
    v_new := regexp_replace(v_def, 'LANGUAGE plpgsql\s+AS', E'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public''\nAS');
    v_new := regexp_replace(v_new, '\ybegin\y',
      E'BEGIN\n  IF NOT public.is_district_admin(' || v_check || E') THEN\n    RAISE EXCEPTION ''Only a league admin can do this'' USING ERRCODE = ''42501'', DETAIL = ''not_authorised'';\n  END IF;\n', 'i');
    if v_new = v_def or v_new not like '%SECURITY DEFINER%' or v_new not like '%Only a league admin%' then
      raise exception 'patch for % did not apply', v_reg;
    end if;
    execute v_new;
  end loop;

  -- initiate_league_competition_instance: admin of the competition's district and of the division's
  v_reg := 'public.initiate_league_competition_instance(uuid,uuid,uuid,integer,integer,integer,integer,boolean,integer,integer,integer,integer,boolean,text,text,text,text,text,uuid[])'::regprocedure;
  v_def := pg_get_functiondef(v_reg);
  v_new := regexp_replace(v_def, 'LANGUAGE plpgsql\s+AS', E'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public''\nAS');
  v_new := regexp_replace(v_new, '\yBEGIN\y',
    E'BEGIN\n  IF NOT public.is_district_admin((select district_id from "Competitions" where id = p_competition_id))\n     OR NOT public.is_district_admin(public.division_district(p_division_id)) THEN\n    RAISE EXCEPTION ''Only a league admin can do this'' USING ERRCODE = ''42501'', DETAIL = ''not_authorised'';\n  END IF;\n', 'i');
  if v_new = v_def or v_new not like '%SECURITY DEFINER%' or v_new not like '%Only a league admin%' then
    raise exception 'patch for initiate_league_competition_instance did not apply';
  end if;
  execute v_new;

  -- update_division_and_propagate
  v_reg := 'public.update_division_and_propagate(uuid,text,text,integer,integer,integer,boolean,boolean,uuid,integer,integer,boolean,text,text,boolean,text,text,text,integer,integer,integer)'::regprocedure;
  v_def := pg_get_functiondef(v_reg);
  v_new := regexp_replace(v_def, 'LANGUAGE plpgsql\s+AS', E'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public''\nAS');
  v_new := regexp_replace(v_new, '\ybegin\y',
    E'begin\n  if not public.is_district_admin(public.division_district(p_division_id))\n     or not public.is_district_admin((select district_id from "Competitions" where id = p_competition_id)) then\n    raise exception ''Only a league admin can do this'' using errcode = ''42501'', detail = ''not_authorised'';\n  end if;\n', 'i');
  if v_new = v_def or v_new not like '%SECURITY DEFINER%' or v_new not like '%Only a league admin%' then
    raise exception 'patch for update_division_and_propagate did not apply';
  end if;
  execute v_new;

  -- end_season (already definer, had no check)
  v_reg := 'public.end_season(uuid)'::regprocedure;
  v_def := pg_get_functiondef(v_reg);
  v_new := regexp_replace(v_def, '\ybegin\y',
    E'begin\n    if not public.is_district_admin((select district from "Seasons" where id = p_season_id)) then\n        raise exception ''Only a league admin can do this'' using errcode = ''42501'', detail = ''not_authorised'';\n    end if;\n', 'i');
  if v_new = v_def or v_new not like '%Only a league admin%' then
    raise exception 'patch for end_season did not apply';
  end if;
  execute v_new;
end
$patch$;

revoke all on function public.generate_knockout_bracket(uuid), public.progress_stage(uuid),
  public.save_league_fixtures(uuid, jsonb), public.end_season(uuid),
  public.initiate_league_competition_instance(uuid,uuid,uuid,integer,integer,integer,integer,boolean,integer,integer,integer,integer,boolean,text,text,text,text,text,uuid[]),
  public.update_division_and_propagate(uuid,text,text,integer,integer,integer,boolean,boolean,uuid,integer,integer,boolean,text,text,boolean,text,text,text,integer,integer,integer)
  from public, anon;
grant execute on function public.generate_knockout_bracket(uuid), public.progress_stage(uuid),
  public.save_league_fixtures(uuid, jsonb), public.end_season(uuid),
  public.initiate_league_competition_instance(uuid,uuid,uuid,integer,integer,integer,integer,boolean,integer,integer,integer,integer,boolean,text,text,text,text,text,uuid[]),
  public.update_division_and_propagate(uuid,text,text,integer,integer,integer,boolean,boolean,uuid,integer,integer,boolean,text,text,boolean,text,text,text,integer,integer,integer)
  to authenticated;

-- ── replaced / unused functions ─────────────────────────────────────────────
-- Superseded by save_fixture_results, remove-from-team flows in TeamPlayers RPCs, and
-- claim_district_by_code / admin invites respectively. No callers in the app or the DB.
drop function if exists public.save_match_results(uuid, jsonb, uuid[]);
drop function if exists public.remove_player_from_team(uuid, uuid);
drop function if exists public.join_district_as_admin(uuid, uuid);
