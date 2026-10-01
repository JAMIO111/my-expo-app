-- remove_player_from_team emits type 'player_left_team', which the original
-- notification_preferences mapping missed (it would have fallen through to the
-- locked "system" category and could not be muted).
insert into public."NotificationTypeCategories" (type, category)
values ('player_left_team', 'my_team')
on conflict (type) do nothing;

update public."Notifications"
set category = 'my_team'
where lower(type) = 'player_left_team' and category = 'system';
