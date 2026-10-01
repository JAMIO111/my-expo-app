-- "Prefer not to say" stores a null gender. A null gender must never satisfy a gender-restricted competition
-- (null <> 'male' is null, which silently passed the old check), so those checks now use IS DISTINCT FROM.
do $patch$
declare v_def text := pg_get_functiondef('public.join_competition(uuid,uuid,uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, 'p.gender <> v_instance.gender', 'p.gender is distinct from v_instance.gender');
  v_new := replace(v_new, 'v_player.gender <> v_instance.gender', 'v_player.gender is distinct from v_instance.gender');
  if v_new = v_def then raise exception 'join_competition gender patch failed'; end if;
  execute v_new;
end
$patch$;

do $patch$
declare v_def text := pg_get_functiondef('public.complete_profile_onboarding(text,text,text,text,date,text)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, 'if p_gender is null or p_gender not in (''male'', ''female'') then
    raise exception ''Select your gender'' using errcode = ''P0001'';',
    'if p_gender is not null and p_gender not in (''male'', ''female'') then
    raise exception ''Invalid gender'' using errcode = ''P0001'';');
  if v_new = v_def then raise exception 'complete_profile_onboarding gender patch failed'; end if;
  execute v_new;
end
$patch$;
