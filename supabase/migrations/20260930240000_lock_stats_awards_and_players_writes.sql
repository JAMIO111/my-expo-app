-- Tables written only by definer functions/triggers: remove client write access entirely.
drop policy if exists "Authenticated write access" on "PlayerStats";
drop policy if exists "Authenticated write access" on "TeamStats";
drop policy if exists "Authenticated write access" on "PlayerAwards";
drop policy if exists "Authenticated write access" on "TeamAwards";
drop policy if exists "Authenticated write access" on "TeamsHistory";
drop policy if exists "Authenticated write access" on "Badges";
drop policy if exists "Authenticated write access" on "BadgesUnlocked";
drop policy if exists "Authenticated write access" on "SeasonDivisions";
drop policy if exists "Authenticated write access" on "CompetitionStageProgressLog";
drop policy if exists "Authenticated write access" on "Sponsors";
drop policy if exists "Authenticated write access" on "CompetitionInstanceSponsors";

revoke insert, update, delete on "PlayerStats", "TeamStats", "PlayerAwards", "TeamAwards", "TeamsHistory", "Badges",
  "BadgesUnlocked", "SeasonDivisions", "CompetitionStageProgressLog", "Sponsors", "CompetitionInstanceSponsors",
  "FixtureReminders", "NotificationCategories", "NotificationTypeCategories" from anon, authenticated;

-- Players: a signed-in user may update only their own row, and never the protected columns.
drop policy if exists "Authenticated write access" on "Players";
create policy "Players update own row" on "Players" for update to authenticated
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());
revoke insert, delete on "Players" from anon, authenticated;
revoke update on "Players" from anon;

create or replace function public.protect_player_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Only requests coming straight from a client (PostgREST roles) are restricted;
  -- security definer functions and the service role run as other roles.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.auth_id is distinct from old.auth_id
     or new.xp is distinct from old.xp
     or new.claimed is distinct from old.claimed
     or new.claimed_at is distinct from old.claimed_at
     or new.canonical_player_id is distinct from old.canonical_player_id
     or new.is_deleted is distinct from old.is_deleted
     or new.deleted_at is distinct from old.deleted_at
     or new.dob_changes_remaining is distinct from old.dob_changes_remaining
     or new.gender_changes_remaining is distinct from old.gender_changes_remaining
     or new.current_frame_win_streak is distinct from old.current_frame_win_streak
     or new.best_frame_win_streak is distinct from old.best_frame_win_streak
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected player fields cannot be changed directly' using errcode = '42501', detail = 'not_authorised';
  end if;

  -- Date of birth and gender have a limited number of changes: after onboarding they
  -- go through update_player_profile.
  if (new.dob is distinct from old.dob or new.gender is distinct from old.gender)
     and coalesce(old.onboarding, 0) >= 1 then
    raise exception 'Use update_player_profile to change date of birth or gender' using errcode = '42501', detail = 'not_authorised';
  end if;

  return new;
end $$;

drop trigger if exists trg_protect_player_columns on "Players";
create trigger trg_protect_player_columns before update on "Players"
  for each row execute function public.protect_player_columns();
