-- League-wide tie-break order, used to rank entrants level on points.
-- Rules (higher is better for all): head_to_head, frame_diff, frames_for, frames_against (fewer is better),
-- wins, special_match. Anything still level after the chosen rules is ordered by name.

alter table "Districts"
  add column if not exists tie_break_rules text[] not null default array['frame_diff', 'frames_for'];

create or replace function public.clean_tie_break_rules(p_rules text[])
returns text[] language plpgsql immutable set search_path = public as $$
declare r text; seen text[] := '{}';
begin
  if p_rules is null or array_length(p_rules, 1) is null then
    return array['frame_diff', 'frames_for'];
  end if;
  if array_length(p_rules, 1) > 6 then
    raise exception 'Choose at most 6 tie-break rules' using errcode = 'P0001', detail = 'invalid_rules';
  end if;
  foreach r in array p_rules loop
    if r not in ('head_to_head', 'frame_diff', 'frames_for', 'frames_against', 'wins', 'special_match') then
      raise exception 'Unknown tie-break rule: %', r using errcode = 'P0001', detail = 'invalid_rules';
    end if;
    if r = any(seen) then
      raise exception 'Each tie-break rule can only be used once' using errcode = 'P0001', detail = 'invalid_rules';
    end if;
    seen := seen || r;
  end loop;
  return p_rules;
end $$;

create or replace function public.tie_break_value(p_rule text, p_won int, p_ff int, p_fa int, p_sp int, p_h2h int)
returns int language sql immutable set search_path = public as $$
  select case p_rule
    when 'head_to_head' then p_h2h
    when 'frame_diff' then p_ff - p_fa
    when 'frames_for' then p_ff
    when 'frames_against' then -p_fa
    when 'wins' then p_won
    when 'special_match' then p_sp
    else 0 end
$$;

create or replace function public.set_tie_break_rules(p_district_id uuid, p_rules text[])
returns text[] language plpgsql security definer set search_path = public as $$
declare v_clean text[];
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can change this' using errcode = '42501', detail = 'not_authorised';
  end if;
  v_clean := public.clean_tie_break_rules(p_rules);
  update "Districts" set tie_break_rules = v_clean where id = p_district_id;
  return v_clean;
end $$;
revoke all on function public.set_tie_break_rules(uuid, text[]) from public, anon;
grant execute on function public.set_tie_break_rules(uuid, text[]) to authenticated;

-- standings use the league's rules
do $patch$
declare v_def text := pg_get_functiondef('public.competition_standings(uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, 'declare ci "CompetitionInstances"%rowtype; v_type text;',
                          'declare ci "CompetitionInstances"%rowtype; v_type text; v_rules text[];');
  v_new := replace(v_new, E'select c.competitor_type::text into v_type from "Competitions" c where c.id = ci.competition_id;\n\n  return query',
    E'select c.competitor_type::text, public.clean_tie_break_rules(d.tie_break_rules) into v_type, v_rules\n    from "Competitions" c left join "Districts" d on d.id = c.district_id where c.id = ci.competition_id;\n\n  return query');
  v_new := replace(v_new, E'  )\n  select r.pid, r.nm',
    E'  ), h as (\n    select r.*, (\n      select coalesce(sum(case when x.h = r.pid then sign(x.hf - x.af) else sign(x.af - x.hf) end), 0)::int\n        from scored x join rows_ o on o.pid = case when x.h = r.pid then x.a else x.h end\n       where (x.h = r.pid or x.a = r.pid) and o.pts = r.pts) as h2h\n    from rows_ r\n  )\n  select r.pid, r.nm');
  v_new := replace(v_new, '(row_number() over (order by r.pts desc, (r.ff - r.fa) desc, r.ff desc, r.nm asc))::int
  from rows_ r',
    E'(row_number() over (order by r.pts desc,\n' ||
    E'     public.tie_break_value(v_rules[1], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     public.tie_break_value(v_rules[2], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     public.tie_break_value(v_rules[3], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     public.tie_break_value(v_rules[4], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     public.tie_break_value(v_rules[5], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     public.tie_break_value(v_rules[6], r.won, r.ff, r.fa, r.sp, r.h2h) desc,\n' ||
    E'     r.nm asc))::int\n  from h r');
  if v_new = v_def or v_new not like '%tie_break_value%' or v_new not like '%from h r%' or v_new not like '%v_rules text[]%'
     or v_new not like '%clean_tie_break_rules(d.tie_break_rules)%' or v_new not like '%, h as (%' then
    raise exception 'competition_standings patch failed';
  end if;
  execute v_new;
end
$patch$;

-- onboarding can set the rules when it creates the league
do $patch$
declare v_def text := pg_get_functiondef('public.create_district_season_divisions(uuid,text,boolean,text,date,text,jsonb,uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, E'_admin_id uuid)\n RETURNS uuid', E'_admin_id uuid, _tie_break_rules text[] DEFAULT NULL::text[])\n RETURNS uuid');
  v_new := replace(v_new, 'private = _is_private,', 'private = _is_private, tie_break_rules = public.clean_tie_break_rules(_tie_break_rules),');
  if v_new = v_def or v_new not like '%clean_tie_break_rules%' or v_new not like '%_tie_break_rules text[]%' then
    raise exception 'create_district_season_divisions patch failed';
  end if;
  drop function public.create_district_season_divisions(uuid,text,boolean,text,date,text,jsonb,uuid);
  execute v_new;
  revoke all on function public.create_district_season_divisions(uuid,text,boolean,text,date,text,jsonb,uuid,text[]) from public, anon;
  grant execute on function public.create_district_season_divisions(uuid,text,boolean,text,date,text,jsonb,uuid,text[]) to authenticated;
end
$patch$;
