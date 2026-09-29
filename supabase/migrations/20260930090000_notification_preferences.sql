-- Notification preferences: per-category, per-channel (in-app / push).
--
-- Every notification is a row in "Notifications" (inserted by many database
-- functions) and an AFTER INSERT trigger pushes it. This adds:
--   * NotificationCategories        - the catalog of categories + their defaults
--   * NotificationTypeCategories    - maps the free-text Notifications.type to a category
--   * NotificationPreferences       - a player's overrides (null = use the default)
--   * Notifications.category / in_app / push - decided once, at insert time, by a
--     BEFORE INSERT trigger, so producers do not need to know about preferences
--   * get_notification_preferences() / set_notification_preference() for the app
--
-- Delivery rules applied at insert time:
--   in_app off + push off -> the row is not stored at all
--   push only             -> stored already read, so it never shows up (or counts
--                            towards the unread badge) in the app, and the daily
--                            cleanup of old read notifications removes it
--   push off              -> stored, but no push is sent
-- To add a new notification type, insert a row into NotificationTypeCategories
-- (unmapped types fall back to the locked "system" category).

-- 1. Catalog ---------------------------------------------------------------
create table public."NotificationCategories" (
  key             text primary key,
  label           text not null,
  description     text not null,
  emoji           text not null,
  section         text not null,
  sort_order      smallint not null,
  default_in_app  boolean not null default true,
  default_push    boolean not null default true,
  locked_in_app   boolean not null default false,
  locked_push     boolean not null default false
);

alter table public."NotificationCategories" enable row level security;
create policy "Signed-in users can read notification categories"
  on public."NotificationCategories" for select to authenticated using (true);

insert into public."NotificationCategories"
  (key, label, description, emoji, section, sort_order, default_in_app, default_push, locked_in_app, locked_push)
values
  ('my_fixtures',     'My Fixtures',     'Fixture reminders, reschedules and result approvals', '🏆', 'Matches',        10, true,  true,  false, false),
  ('live_matches',    'Live Matches',    'Live scores and results as they happen',              '🔴', 'Matches',        20, false, false, false, false),
  ('my_team',         'My Team',         'Invites, join requests and team announcements',       '👥', 'Team & League',  30, true,  true,  false, false),
  ('league',          'League',          'Results, table changes and playoffs',                 '📊', 'Team & League',  40, true,  true,  false, false),
  ('league_news',     'League News',     'Announcements from your league admins',               '📣', 'Team & League',  50, true,  true,  false, false),
  ('achievements',    'Achievements',    'Badges, XP and milestones',                           '🏅', 'Progress',       60, true,  true,  false, false),
  ('break_room_news', 'Break Room News', 'New features and news from Break Room',               '📰', 'App',            70, true,  true,  false, false),
  ('social',          'Social',          'Mentions and interactions',                           '💬', 'App',            80, true,  true,  false, false),
  ('subscription',    'Subscription',    'Payments and your subscription',                      '💳', 'App',            90, true,  true,  false, false),
  ('system',          'System',          'Important account notifications',                     '⚙️', 'App',           100, true,  true,  true,  true);

-- 2. Notification type -> category ----------------------------------------
create table public."NotificationTypeCategories" (
  type      text primary key,
  category  text not null references public."NotificationCategories"(key) on update cascade
);

alter table public."NotificationTypeCategories" enable row level security;
create policy "Signed-in users can read notification type mapping"
  on public."NotificationTypeCategories" for select to authenticated using (true);

insert into public."NotificationTypeCategories" (type, category) values
  ('match_reminder',            'my_fixtures'),
  ('result_submission_pending', 'my_fixtures'),
  ('result_approval_pending',   'my_fixtures'),
  ('result_amendment_pending',  'my_fixtures'),
  ('team_invite',               'my_team'),
  ('invite_revoked',            'my_team'),
  ('request_accepted',          'my_team'),
  ('request_rejected',          'my_team'),
  ('player_joined',             'my_team'),
  ('player_joined_team',        'my_team'),
  ('player_left',               'my_team'),
  ('player_removed',            'my_team'),
  ('role_change',               'my_team'),
  ('team_captain_promoted',     'my_team'),
  ('team_vice_captain_promoted','my_team'),
  ('season_started',            'league'),
  ('system',                    'system');

-- 3. Player overrides -------------------------------------------------------
create table public."NotificationPreferences" (
  player_id   uuid not null references public."Players"(id) on update cascade on delete cascade,
  category    text not null references public."NotificationCategories"(key) on update cascade on delete cascade,
  in_app      boolean,
  push        boolean,
  updated_at  timestamptz not null default now(),
  primary key (player_id, category)
);

alter table public."NotificationPreferences" enable row level security;
create policy "Players manage their own notification preferences"
  on public."NotificationPreferences" for all
  using (player_id = (select "Players".id from public."Players" where "Players".auth_id = auth.uid()))
  with check (player_id = (select "Players".id from public."Players" where "Players".auth_id = auth.uid()));

-- 4. Notifications: category + delivery flags ------------------------------
alter table public."Notifications"
  add column category text references public."NotificationCategories"(key) on update cascade,
  add column in_app   boolean not null default true,
  add column push     boolean not null default true;

update public."Notifications" n
set category = case
  when n.type = 'system' and n.title = 'New season started' then 'league'
  else coalesce(
    (select m.category from public."NotificationTypeCategories" m where m.type = lower(n.type)),
    'system'
  )
end
where n.category is null;

-- 5. Decide delivery when a notification is created ------------------------
create or replace function public.resolve_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_mapped text;
  v_cat    record;
  v_pref   record;
begin
  if new.category is null then
    select m.category into v_mapped
    from "NotificationTypeCategories" m
    where m.type = lower(new.type);
    new.category := coalesce(v_mapped, 'system');
  end if;

  select * into v_cat from "NotificationCategories" where key = new.category;
  if not found then
    new.category := 'system';
    select * into v_cat from "NotificationCategories" where key = 'system';
  end if;

  select p.in_app, p.push into v_pref
  from "NotificationPreferences" p
  where p.player_id = new.player_id and p.category = new.category;

  new.in_app := case when v_cat.locked_in_app then true else coalesce(v_pref.in_app, v_cat.default_in_app) end;
  new.push   := case when v_cat.locked_push   then true else coalesce(v_pref.push,   v_cat.default_push)   end;

  if not new.in_app and not new.push then
    return null;
  end if;

  if not new.in_app then
    new.read := true;
    new.read_at := now();
  end if;

  return new;
end;
$function$;

create trigger trg_resolve_notification_delivery
  before insert on public."Notifications"
  for each row execute function public.resolve_notification_delivery();

-- Only push when the recipient wants a push for this category.
create or replace function public.notify_push_on_insert()
returns trigger
language plpgsql
security definer
as $function$
declare
    v_service_role_key text;
begin
    if new.push is not true then
        return new;
    end if;

    select decrypted_secret into v_service_role_key
    from vault.decrypted_secrets
    where name = 'service_role_key';

    perform net.http_post(
        url := 'https://ionhcfjampzewimsgsmr.supabase.co/functions/v1/send-push',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
            'player_id', new.player_id,
            'title', new.title,
            'message', new.message,
            'data', new.data
        )
    );
    return new;
end;
$function$;

-- 6. "New season started" is a league event, not a system one --------------
do $migration$
declare
  def text;
  matches int;
begin
  select pg_get_functiondef(p.oid) into def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'start_new_season';

  if def is null then
    raise exception 'function start_new_season not found';
  end if;

  matches := (length(def) - length(replace(def, '''system'',', ''))) / length('''system'',');
  if matches <> 2 then
    raise exception 'expected exactly 2 ''system'' literals in start_new_season, found %', matches;
  end if;

  execute replace(def, '''system'',', '''season_started'',');
end
$migration$;

-- 7. App-facing API ---------------------------------------------------------
create or replace function public.get_notification_preferences()
returns json
language sql
stable
as $function$
  select coalesce(
    json_agg(
      json_build_object(
        'key', c.key,
        'label', c.label,
        'description', c.description,
        'emoji', c.emoji,
        'section', c.section,
        'in_app', case when c.locked_in_app then true else coalesce(p.in_app, c.default_in_app) end,
        'push',   case when c.locked_push   then true else coalesce(p.push,   c.default_push)   end,
        'locked_in_app', c.locked_in_app,
        'locked_push', c.locked_push,
        'default_in_app', c.default_in_app,
        'default_push', c.default_push
      )
      order by c.sort_order
    ),
    '[]'::json
  )
  from public."NotificationCategories" c
  left join public."NotificationPreferences" p
    on p.category = c.key
   and p.player_id = (select pl.id from public."Players" pl where pl.auth_id = auth.uid());
$function$;

create or replace function public.set_notification_preference(
  _category text,
  _channel text,
  _enabled boolean
)
returns json
language plpgsql
as $function$
declare
  v_player uuid;
  v_cat    record;
begin
  if _channel not in ('in_app', 'push') then
    raise exception 'Invalid channel: %', _channel;
  end if;

  select pl.id into v_player from public."Players" pl where pl.auth_id = auth.uid();
  if v_player is null then
    raise exception 'Not signed in';
  end if;

  select * into v_cat from public."NotificationCategories" where key = _category;
  if not found then
    raise exception 'Unknown notification category: %', _category;
  end if;

  if (_channel = 'in_app' and v_cat.locked_in_app) or (_channel = 'push' and v_cat.locked_push) then
    raise exception '% notifications cannot be turned off for %', _channel, v_cat.label;
  end if;

  insert into public."NotificationPreferences" (player_id, category, in_app, push)
  values (
    v_player,
    _category,
    case when _channel = 'in_app' then _enabled end,
    case when _channel = 'push' then _enabled end
  )
  on conflict (player_id, category) do update set
    in_app = case when _channel = 'in_app' then _enabled else "NotificationPreferences".in_app end,
    push   = case when _channel = 'push'   then _enabled else "NotificationPreferences".push   end,
    updated_at = now();

  return (
    select e
    from json_array_elements(public.get_notification_preferences()) e
    where e ->> 'key' = _category
    limit 1
  );
end;
$function$;

revoke all on function public.get_notification_preferences() from public, anon;
revoke all on function public.set_notification_preference(text, text, boolean) from public, anon;
grant execute on function public.get_notification_preferences() to authenticated;
grant execute on function public.set_notification_preference(text, text, boolean) to authenticated;
