-- Reminder facts count only activity with the student's current mentor, so a
-- re-matched student gets "say hi" and "book" reminders for the new mentor.

create or replace function public.email_reminder_student_facts(p_user_ids uuid[] default null)
returns table (user_id uuid, first_message_at timestamptz, first_booking_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select
    sp.user_id,
    (
      select min(m.created_at)
      from messages m
      join conversations c on c.id = m.conversation_id
      where m.sender_id = sp.user_id
        and sp.matched_mentor_id = any (c.participant_ids)
    ),
    (
      select min(b.created_at)
      from session_bookings b
      where b.student_id = sp.user_id
        and b.mentor_id = sp.matched_mentor_id
    )
  from student_profiles sp
  where sp.matched_mentor_id is not null
    and (p_user_ids is null or sp.user_id = any (p_user_ids));
$$;

revoke all on function public.email_reminder_student_facts(uuid[]) from public, anon, authenticated;
grant execute on function public.email_reminder_student_facts(uuid[]) to service_role;
