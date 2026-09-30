-- A team request that is rejected or withdrawn cancels the team. Its name, display name and abbreviation
-- must be free to use again, so the uniqueness rules ignore cancelled teams.
alter table "Teams" drop constraint if exists "Teams_abbreviation_key";
create unique index if not exists "Teams_abbreviation_key" on "Teams" (abbreviation) where status <> 'cancelled';

drop index if exists teams_main_name_key;
create unique index teams_main_name_key on "Teams" (name) where parent_team_id is null and status <> 'cancelled';
drop index if exists teams_main_display_name_key;
create unique index teams_main_display_name_key on "Teams" (display_name) where parent_team_id is null and status <> 'cancelled';

-- admins also see the team sign-up code
do $patch$
declare v_def text := pg_get_functiondef('public.get_user_context(uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def,
    'jsonb_build_object(''code'', (select c.code from "DistrictAdminCodes" c where c.district_id = dist.id))',
    'jsonb_build_object(''code'', (select c.code from "DistrictAdminCodes" c where c.district_id = dist.id), ''team_signup_code'', (select j.code from "DistrictJoinCodes" j where j.district_id = dist.id))');
  if v_new = v_def then raise exception 'get_user_context patch failed'; end if;
  execute v_new;
end
$patch$;
