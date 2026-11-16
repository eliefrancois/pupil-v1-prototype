-- Signup can only create the roles the signup forms use. Admins are promoted by hand.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.users (id, email, full_name, role, subscription_status, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN requested_role IN ('student', 'mentor') THEN requested_role ELSE 'student' END,
    'inactive',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Students and mentors can create upcoming bookings with their own match and
-- cancel them. Everything else on a booking is written by the server.
CREATE OR REPLACE FUNCTION public.session_bookings_participant_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed text[];
BEGIN
  IF coalesce(auth.role(), 'service_role') = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'You can only book sessions for yourself';
    END IF;
    IF NEW.mentor_id IS DISTINCT FROM (
      SELECT sp.matched_mentor_id FROM public.student_profiles sp WHERE sp.user_id = NEW.student_id
    ) THEN
      RAISE EXCEPTION 'You can only book your matched mentor';
    END IF;
    IF NEW.status IS DISTINCT FROM 'upcoming' OR NEW.starts_at <= now() THEN
      RAISE EXCEPTION 'Pick a time in the future';
    END IF;

    NEW.duration := 30;
    NEW.created_at := now();
    NEW.cancel_token := gen_random_uuid()::text;
    NEW.calendar_event_id := NULL;
    NEW.daily_room_name := NULL;
    NEW.daily_room_url := NULL;
    NEW.daily_meeting_token_mentor := NULL;
    NEW.daily_meeting_token_student := NULL;
    NEW.started_at := NULL;
    NEW.ended_at := NULL;
    NEW.duration_seconds := NULL;
    NEW.recording_url := NULL;
    NEW.transcript_url := NULL;
    NEW.transcript_text := NULL;
    NEW.transcript_status := 'pending';
    NEW.cancelled_at := NULL;
    NEW.cancelled_by := NULL;
    NEW.cancel_reason := NULL;
    RETURN NEW;
  END IF;

  -- free_trial_released_at is stamped by session_bookings_entitlement_guard.
  SELECT array_agg(n.key) INTO changed
  FROM jsonb_each(to_jsonb(NEW)) n
  WHERE n.value IS DISTINCT FROM to_jsonb(OLD) -> n.key
    AND n.key <> 'free_trial_released_at';

  IF changed IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'upcoming'
    AND NEW.status = 'cancelled'
    AND NEW.cancelled_by = auth.uid()
    AND changed <@ ARRAY['status', 'cancelled_at', 'cancelled_by', 'cancel_reason'] THEN
    NEW.cancelled_at := now();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'You can only cancel an upcoming session' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS session_bookings_participant_guard ON public.session_bookings;
CREATE TRIGGER session_bookings_participant_guard
  BEFORE INSERT OR UPDATE ON public.session_bookings
  FOR EACH ROW EXECUTE FUNCTION public.session_bookings_participant_guard();

-- Session credits are server-managed. Booking still counts a credit with the
-- student's own client, so increments are allowed; refunds and totals aren't.
CREATE OR REPLACE FUNCTION public.student_profiles_guard_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), 'service_role') = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.sessions_used := 0;
    NEW.sessions_total := 24;
    RETURN NEW;
  END IF;

  IF NEW.sessions_used < OLD.sessions_used
    OR NEW.sessions_total IS DISTINCT FROM OLD.sessions_total THEN
    RAISE EXCEPTION 'Only Pupil can change session credits' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_profiles_guard_credits ON public.student_profiles;
CREATE TRIGGER student_profiles_guard_credits
  BEFORE INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.student_profiles_guard_credits();
