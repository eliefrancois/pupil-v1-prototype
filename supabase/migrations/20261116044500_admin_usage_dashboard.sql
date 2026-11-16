-- Admin usage dashboard (/admin/usage).
--
-- admin_user_classification is the single source of truth for which accounts
-- count as real users in analytics. Imported ghost mentors keep
-- signup_source = 'csv_import_2023' after they claim, so claimed_at is what
-- moves them out of ghost_import.
--
-- Both objects are service-role only: they expose every account's class and
-- aggregate counts across all users.

create or replace view public.admin_user_classification
with (security_invoker = true) as
select
  u.id as user_id,
  u.role,
  u.created_at,
  case
    when mp.signup_source = 'csv_import_2023' and mp.claimed_at is null then 'ghost_import'
    when u.role = 'admin' then 'admin'
    when split_part(lower(u.email), '@', 2) in ('getpupil.com', 'unicover.app', 'pupil.dev', 'hispanicheritage.org') then 'internal_demo'
    when lower(u.email) ~ '^test' or lower(u.email) = 'mentor@gmail.com' then 'test'
    when u.full_name ~* '(elie|brunell)\s+francois|dario\s+anaya' then 'founder'
    when split_part(u.email, '@', 1) ~ '^([^.]*\.){3,}' and btrim(u.full_name) !~ ' ' then 'bot'
    else 'real'
  end as account_class
from public.users u
left join public.mentor_profiles mp on mp.user_id = u.id;

revoke all on public.admin_user_classification from public, anon, authenticated;
grant select on public.admin_user_classification to service_role;

-- Pair, message, and session metrics are keyed on the STUDENT being real, so
-- real students matched to a founder's mentor account still count.
create or replace function public.admin_usage_metrics(p_bucket text default 'week')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with params as (
  select case when p_bucket = 'month' then 'month' else 'week' end as b
),
cls as (
  select user_id, role, created_at, account_class
  from admin_user_classification
),
real_students as (
  select
    c.user_id,
    c.created_at,
    coalesce(u.onboarding_complete, false) as onboarded,
    sp.created_at as onboarded_at,
    sp.matched_mentor_id
  from cls c
  join users u on u.id = c.user_id
  left join student_profiles sp on sp.user_id = c.user_id
  where c.role = 'student' and c.account_class = 'real'
),
student_msgs as (
  select m.sender_id as student_id, min(m.created_at) as first_at
  from messages m
  join real_students rs on rs.user_id = m.sender_id
  group by m.sender_id
),
student_bookings as (
  select b.student_id, bool_or(b.status = 'completed') as completed
  from session_bookings b
  join real_students rs on rs.user_id = b.student_id
  group by b.student_id
),
real_convs as (
  select distinct c.id
  from conversations c
  join real_students rs on rs.user_id = any (c.participant_ids)
),
counted_messages as (
  select m.created_at
  from messages m
  left join cls s on s.user_id = m.sender_id
  where s.account_class = 'real'
     or m.conversation_id in (select id from real_convs)
),
buckets as (
  select generate_series(
    date_trunc(p.b, now() - interval '6 months'),
    date_trunc(p.b, now()),
    ('1 ' || p.b)::interval
  ) as bucket_start
  from params p
),
events as (
  select 'student_signups' as series, created_at as ts from real_students
  union all
  select 'onboarding_completions', onboarded_at from real_students where onboarded_at is not null
  union all
  select 'mentor_signups', created_at from cls where role = 'mentor' and account_class = 'real'
  union all
  select 'match_requests', mr.requested_at
  from match_requests mr
  join real_students rs on rs.user_id = mr.student_id
  union all
  select 'messages_sent', created_at from counted_messages
  union all
  select 'sessions_booked', b.created_at
  from session_bookings b
  join real_students rs on rs.user_id = b.student_id
),
trend as (
  select
    bk.bucket_start,
    count(*) filter (where e.series = 'student_signups') as student_signups,
    count(*) filter (where e.series = 'onboarding_completions') as onboarding_completions,
    count(*) filter (where e.series = 'mentor_signups') as mentor_signups,
    count(*) filter (where e.series = 'match_requests') as match_requests,
    count(*) filter (where e.series = 'messages_sent') as messages_sent,
    count(*) filter (where e.series = 'sessions_booked') as sessions_booked
  from buckets bk
  cross join params p
  left join events e on date_trunc(p.b, e.ts) = bk.bucket_start
  group by bk.bucket_start
),
funnel as (
  select
    count(*) as signed_up,
    count(*) filter (where rs.onboarded) as onboarded,
    count(*) filter (where rs.onboarded and rs.matched_mentor_id is not null) as matched,
    count(*) filter (where rs.onboarded and rs.matched_mentor_id is not null and sm.student_id is not null) as messaged,
    count(*) filter (where rs.onboarded and rs.matched_mentor_id is not null and sm.student_id is not null and sb.student_id is not null) as booked,
    count(*) filter (where rs.onboarded and rs.matched_mentor_id is not null and sm.student_id is not null and sb.completed) as completed
  from real_students rs
  left join student_msgs sm on sm.student_id = rs.user_id
  left join student_bookings sb on sb.student_id = rs.user_id
),
pairs_by_mentor_class as (
  select
    coalesce(mc.account_class, 'unknown') as mentor_class,
    count(*) as pairs,
    count(distinct rs.matched_mentor_id) as mentors
  from real_students rs
  left join cls mc on mc.user_id = rs.matched_mentor_id
  where rs.matched_mentor_id is not null
  group by 1
),
imported as (
  select *
  from mentor_profiles
  where signup_source = 'csv_import_2023'
),
excluded as (
  select account_class, role, count(*) as n
  from cls
  where account_class <> 'real'
  group by account_class, role
)
select jsonb_build_object(
  'bucket', (select b from params),
  'headline', jsonb_build_object(
    'total_students', (select count(*) from real_students),
    'onboarded_students', (select count(*) from real_students where onboarded),
    'approved_real_mentors', (
      select count(*)
      from cls c
      join mentor_profiles mp on mp.user_id = c.user_id
      where c.role = 'mentor' and c.account_class = 'real' and mp.status = 'approved'
    ),
    'active_pairs', (select count(*) from real_students where matched_mentor_id is not null),
    'students_messaged', (select count(*) from student_msgs),
    'sessions_completed', (
      select count(*)
      from session_bookings b
      join real_students rs on rs.user_id = b.student_id
      where b.status = 'completed'
    ),
    'paying_subscribers', (
      select count(*)
      from cls c
      join users u on u.id = c.user_id
      where c.account_class = 'real' and u.subscription_status = 'active'
    )
  ),
  'pairs_by_mentor_class', coalesce(
    (select jsonb_agg(to_jsonb(p) order by p.pairs desc) from pairs_by_mentor_class p),
    '[]'::jsonb
  ),
  'trend', coalesce(
    (select jsonb_agg(to_jsonb(t) order by t.bucket_start) from trend t),
    '[]'::jsonb
  ),
  'funnel', (select to_jsonb(f) from funnel f),
  'claim_campaign', (
    select jsonb_build_object(
      'imported', count(*),
      'step_0', count(*) filter (where coalesce(claim_campaign_step, 0) = 0),
      'step_1', count(*) filter (where claim_campaign_step = 1),
      'step_2', count(*) filter (where claim_campaign_step = 2),
      'step_3', count(*) filter (where claim_campaign_step = 3),
      'emailed', count(*) filter (where claim_campaign_sent_at is not null),
      'claimed', count(*) filter (where claimed_at is not null or claim_status = 'claimed'),
      'opted_out', count(*) filter (where claim_status = 'unreachable'),
      'hidden', count(*) filter (where claim_status is null and status = 'paused'),
      'still_ghost', count(*) filter (where claim_status = 'ghost')
    )
    from imported
  ),
  'excluded', coalesce(
    (select jsonb_agg(to_jsonb(x) order by x.account_class, x.role) from excluded x),
    '[]'::jsonb
  )
);
$$;

revoke all on function public.admin_usage_metrics(text) from public, anon, authenticated;
grant execute on function public.admin_usage_metrics(text) to service_role;
