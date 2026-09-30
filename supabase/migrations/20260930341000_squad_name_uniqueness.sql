-- Team names were globally unique across every team, so a squad could never reuse the name of a
-- cancelled squad, nor share a name with a squad in another club. Main teams stay globally unique;
-- squad names are unique within their parent team (cancelled squads excluded).
alter table "Teams" drop constraint if exists "Teams_name_key";
alter table "Teams" drop constraint if exists "Teams_display_name_key";
drop index if exists public."Teams_name_key";
drop index if exists public."Teams_display_name_key";

create unique index teams_main_name_key on "Teams" (name) where parent_team_id is null;
create unique index teams_main_display_name_key on "Teams" (display_name) where parent_team_id is null;
create unique index teams_squad_name_key on "Teams" (parent_team_id, lower(name))
  where parent_team_id is not null and status <> 'cancelled';
