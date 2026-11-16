-- Lifecycle reminder emails (lib/reminders, /api/cron/reminders, /admin/reminders).
--
-- Every new table is service-role only: RLS on with no policies, and no
-- grants to anon/authenticated. The cron job and admin pages use the
-- service client.

-- ---------------------------------------------------------------------------
-- Per-user email preferences and deliverability
--
-- Kept off public.users because matched mentors and students can read each
-- other's users rows, and the unsubscribe token must stay private.
-- ---------------------------------------------------------------------------

create table if not exists public.email_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  unsubscribe_token text not null unique
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  -- Global opt-out from reminder emails. Transactional emails still go out.
  unsubscribed_at timestamptz,
  email_bounced_at timestamptz,
  bounce_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.email_preferences (user_id)
select id from public.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Match timestamp and re-match flags on students
-- ---------------------------------------------------------------------------

alter table public.student_profiles
  add column if not exists matched_at timestamptz,
  add column if not exists needs_rematch_at timestamptz,
  add column if not exists rematch_reason text;

-- No match timestamp existed before this migration, so existing pairs start
-- their reminder clock today.
update public.student_profiles
set matched_at = now()
where matched_mentor_id is not null and matched_at is null;

-- Any change of mentor (admin assign, reassign, unassign) restamps matched_at
-- and clears a pending re-match flag.
create or replace function public.student_profiles_track_match()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.matched_mentor_id is not null and new.matched_at is null then
      new.matched_at := now();
    end if;
  elsif new.matched_mentor_id is distinct from old.matched_mentor_id then
    new.matched_at := case when new.matched_mentor_id is null then null else now() end;
    new.needs_rematch_at := null;
    new.rematch_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists student_profiles_track_match on public.student_profiles;
create trigger student_profiles_track_match
  before insert or update of matched_mentor_id on public.student_profiles
  for each row execute function public.student_profiles_track_match();

create index if not exists student_profiles_needs_rematch_idx
  on public.student_profiles (needs_rematch_at)
  where needs_rematch_at is not null;

-- ---------------------------------------------------------------------------
-- Reminder settings, state, and log
-- ---------------------------------------------------------------------------

create table if not exists public.email_reminder_settings (
  reminder_key text primary key,
  enabled boolean not null default false,
  -- Set when an admin turns the reminder on. Sends start the next ET day;
  -- until then the job only records who would be emailed.
  live_since timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);

insert into public.email_reminder_settings (reminder_key)
values
  ('mentor_matched_no_availability'),
  ('mentor_set_availability'),
  ('mentor_finish_profile'),
  ('student_say_hi'),
  ('student_book_first_session'),
  ('student_finish_onboarding')
on conflict (reminder_key) do nothing;

create table if not exists public.email_reminder_state (
  user_id uuid not null references public.users (id) on delete cascade,
  reminder_key text not null,
  -- The event the cadence counts from (approval, signup, match, first
  -- message). A different anchor restarts the reminder from round 1.
  anchor_at timestamptz not null,
  round smallint not null default 1,
  step smallint not null default 0,
  round_started_at timestamptz not null,
  last_sent_at timestamptz,
  next_due_at timestamptz,
  completed_at timestamptz,
  stopped_reason text,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, reminder_key)
);

create table if not exists public.email_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  reminder_key text not null,
  round smallint not null,
  step smallint not null,
  -- Calendar date in the recipient's time zone; enforces one email per day.
  local_date date not null,
  dry_run boolean not null default false,
  -- null while the send is in flight.
  ok boolean,
  error text,
  cc_parent boolean not null default false,
  sent_at timestamptz not null default now()
);

create unique index if not exists email_reminder_log_one_per_day
  on public.email_reminder_log (user_id, local_date)
  where not dry_run and ok is distinct from false;

create unique index if not exists email_reminder_log_dry_run_once
  on public.email_reminder_log (user_id, reminder_key, local_date)
  where dry_run;

create index if not exists email_reminder_log_sent_at_idx
  on public.email_reminder_log (sent_at desc);

-- ---------------------------------------------------------------------------
-- One-click login links
-- ---------------------------------------------------------------------------

create table if not exists public.login_link_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references public.users (id) on delete cascade,
  target_path text not null,
  purpose text not null,
  login_expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_link_tokens_user_idx
  on public.login_link_tokens (user_id);

-- ---------------------------------------------------------------------------
-- Per-student activity facts the reminder job needs in one round-trip
-- ---------------------------------------------------------------------------

create or replace function public.email_reminder_student_facts(p_user_ids uuid[] default null)
returns table (user_id uuid, first_message_at timestamptz, first_booking_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select
    u.id,
    (select min(m.created_at) from messages m where m.sender_id = u.id),
    (select min(b.created_at) from session_bookings b where b.student_id = u.id)
  from users u
  where u.role = 'student'
    and (p_user_ids is null or u.id = any (p_user_ids));
$$;

-- ---------------------------------------------------------------------------
-- Lock down
-- ---------------------------------------------------------------------------

alter table public.email_preferences enable row level security;
alter table public.email_reminder_settings enable row level security;
alter table public.email_reminder_state enable row level security;
alter table public.email_reminder_log enable row level security;
alter table public.login_link_tokens enable row level security;

revoke all on public.email_preferences from public, anon, authenticated;
revoke all on public.email_reminder_settings from public, anon, authenticated;
revoke all on public.email_reminder_state from public, anon, authenticated;
revoke all on public.email_reminder_log from public, anon, authenticated;
revoke all on public.login_link_tokens from public, anon, authenticated;

grant all on public.email_preferences to service_role;
grant all on public.email_reminder_settings to service_role;
grant all on public.email_reminder_state to service_role;
grant all on public.email_reminder_log to service_role;
grant all on public.login_link_tokens to service_role;

revoke all on function public.email_reminder_student_facts(uuid[]) from public, anon, authenticated;
grant execute on function public.email_reminder_student_facts(uuid[]) to service_role;
