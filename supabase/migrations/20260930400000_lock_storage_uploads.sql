-- Storage writes were open to every signed-in user for every path, so anyone could overwrite or delete
-- another player's avatar or a team's cover image.
--   avatars            : only inside your own <auth user id>/ folder
--   team-cover-images  : inside <team id>/ if you run the team (captain / vice captain / league admin),
--                        or your own <player id>/ folder (used while a new team is being created)
--   sponsor-logos      : no client writes (service role only)
-- Buckets also only accept images up to 5 MB.

drop policy if exists objects_insert_policy on storage.objects;
drop policy if exists objects_update_policy on storage.objects;
drop policy if exists objects_delete_policy on storage.objects;

create or replace function public.can_write_storage_path(p_bucket text, p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_folder text := (storage.foldername(p_name))[1];
begin
  if v_folder is null then return false; end if;
  if p_bucket = 'avatars' then
    return v_folder = auth.uid()::text;
  elsif p_bucket = 'team-cover-images' then
    if v_folder = public.current_player_id()::text then return true; end if;
    if v_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return public.can_manage_team(v_folder::uuid);
    end if;
    return false;
  end if;
  return false;
end $$;
revoke all on function public.can_write_storage_path(text, text) from public, anon;
grant execute on function public.can_write_storage_path(text, text) to authenticated;

create policy objects_insert_policy on storage.objects for insert to authenticated
  with check (public.can_write_storage_path(bucket_id, name));
create policy objects_update_policy on storage.objects for update to authenticated
  using (public.can_write_storage_path(bucket_id, name))
  with check (public.can_write_storage_path(bucket_id, name));
create policy objects_delete_policy on storage.objects for delete to authenticated
  using (public.can_write_storage_path(bucket_id, name));

update storage.buckets
   set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
 where id in ('avatars', 'team-cover-images');
