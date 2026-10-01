-- Audit follow-up. Several SECURITY DEFINER functions took a player id as an argument and
-- trusted it, were executable by anonymous callers, or returned more than they should:
--  * update_player_profile: anyone could change any player's name / dob / gender
--  * child-team functions (create / update / accept / decline / leave / list): acted for any player id
--  * get_user_context: returned the league ADMIN CODE to every player in the league, and answered
--    for any auth id; its competitions list was not limited to the player's own league
--  * restore_user_from_deletion, recreate_player_frame_context, cleanup_old_read_notifications and
--    get_auth_user_profile were callable by clients
--  * join_competition: a former captain could still enter a team, and the max-age check read the
--    wrong table
-- and every definer function was executable by the anonymous role.

create or replace function pg_temp.patch_fn(p_reg regprocedure, p_from text, p_to text, p_regex boolean default false, p_flags text default '')
returns void language plpgsql as $$
declare v_def text := pg_get_functiondef(p_reg); v_new text;
begin
  v_new := case when p_regex then regexp_replace(v_def, p_from, p_to, p_flags) else replace(v_def, p_from, p_to) end;
  if v_new = v_def then raise exception 'patch for % did not apply (%)', p_reg, left(p_from, 40); end if;
  execute v_new;
end $$;

-- ── identity guards ─────────────────────────────────────────────────────────
select pg_temp.patch_fn('public.update_player_profile(uuid,text,text,text,date,boolean,text,boolean)'::regprocedure,
  '\ybegin\y',
  E'BEGIN\n  IF p_player_id IS DISTINCT FROM public.current_player_id() THEN\n    RETURN jsonb_build_object(''success'', false, ''error'', ''NOT_AUTHORISED'');\n  END IF;\n', true, 'i');

select pg_temp.patch_fn('public.accept_child_team_invite(uuid,uuid)'::regprocedure, '\ybegin\y',
  E'begin\n    if _player_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only act for yourself.'');\n    end if;\n', true, 'i');
select pg_temp.patch_fn('public.decline_child_team_invite(uuid,uuid)'::regprocedure, '\ybegin\y',
  E'begin\n    if _player_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only act for yourself.'');\n    end if;\n', true, 'i');
select pg_temp.patch_fn('public.leave_child_team(uuid,uuid)'::regprocedure, '\ybegin\y',
  E'begin\n    if _player_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only act for yourself.'');\n    end if;\n', true, 'i');
select pg_temp.patch_fn('public.get_child_team_invites(uuid,uuid)'::regprocedure, '\ybegin\y',
  E'begin\n    if _player_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only view your own invites.'');\n    end if;\n', true, 'i');
select pg_temp.patch_fn('public.create_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure, '\ybegin\y',
  E'begin\n    if _creator_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only create a team as yourself.'');\n    end if;\n', true, 'i');
select pg_temp.patch_fn('public.update_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure, '\ybegin\y',
  E'begin\n    if _updater_id is distinct from public.current_player_id() then\n        return jsonb_build_object(''success'', false, ''code'', ''FORBIDDEN'', ''message'', ''You can only update a team as yourself.'');\n    end if;\n', true, 'i');

-- ── join_competition ────────────────────────────────────────────────────────
select pg_temp.patch_fn('public.join_competition(uuid,uuid,uuid)'::regprocedure,
  E'and role = ''captain''', E'and role = ''captain''\n        and status = ''active''');
select pg_temp.patch_fn('public.join_competition(uuid,uuid,uuid)'::regprocedure,
  'v_competition.max_age', 'v_instance.max_age');

-- ── get_user_context ────────────────────────────────────────────────────────
-- 1) only answer for the signed-in user (service-role callers have no auth.uid())
select pg_temp.patch_fn('public.get_user_context(uuid)'::regprocedure,
  E'select\\s+id\\s+into\\s+v_player_id\\s+from\\s+"Players"\\s+where\\s+auth_id\\s*=\\s*_auth_id;',
  E'if auth.uid() is not null and _auth_id is distinct from auth.uid() then\n    return jsonb_build_object(''user'', _auth_id, ''playerProfile'', null, ''roles'', ''[]''::jsonb);\nend if;\n\nselect id into v_player_id from "Players" where auth_id = _auth_id;',
  true, '');

-- 2) the admin code goes to admins only: drop it from the player role's district (first occurrence)
do $patch$
declare
  v_def text := pg_get_functiondef('public.get_user_context(uuid)'::regprocedure);
  v_needle text := E'''district'', to_jsonb(dist) || jsonb_build_object(''code'', (select c.code from "DistrictAdminCodes" c where c.district_id = dist.id)),';
  v_pos int := position(v_needle in v_def);
  v_new text;
begin
  if v_pos = 0 then raise exception 'get_user_context: admin code line not found'; end if;
  v_new := substr(v_def, 1, v_pos - 1) || E'''district'', to_jsonb(dist),' || substr(v_def, v_pos + length(v_needle));
  execute v_new;
end
$patch$;

-- 3) competitions only from the role's own league (was every active season in every league)
select pg_temp.patch_fn('public.get_user_context(uuid)'::regprocedure,
  E'join\\s+"Seasons"\\s+s\\s+on\\s+s\\.id\\s*=\\s*ci\\.season_id\\s+where\\s+s\\.status\\s*=\\s*''active''',
  E'join "Seasons" s on s.id = ci.season_id\n                    where s.status = ''active'' and s.district = dist.id',
  true, 'g');

-- ── fixed search_path on definer functions that had none ─────────────────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as f from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and p.prosecdef
      and p.proconfig is null and p.proname <> 'notify_push_on_insert'
  loop
    execute format('alter function %s set search_path = public', r.f);
  end loop;
end $$;

-- ── execute privileges ──────────────────────────────────────────────────────
-- Remove the implicit PUBLIC / anon grants from every definer function. Whatever
-- signed-in users could already call keeps an explicit grant, except the internal
-- functions below (triggers, cron, service-role and helper functions), which lose it.
do $$
declare
  r record;
  v_internal text[] := array[
    'cleanup_old_read_notifications', 'recreate_player_frame_context', 'restore_user_from_deletion',
    'get_auth_user_profile', 'update_district_onboarding'];
  v_auth boolean;
begin
  for r in
    select p.oid, p.oid::regprocedure as f, p.proname, (p.prorettype = 'trigger'::regtype) as is_trigger
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and p.prosecdef
  loop
    v_auth := has_function_privilege('authenticated', r.oid, 'execute');
    execute format('revoke execute on function %s from public, anon', r.f);
    if r.is_trigger or r.proname = any(v_internal) then
      execute format('revoke execute on function %s from authenticated', r.f);
    elsif v_auth then
      execute format('grant execute on function %s to authenticated', r.f);
    end if;
  end loop;
end $$;
