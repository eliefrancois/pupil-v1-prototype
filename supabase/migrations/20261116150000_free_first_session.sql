-- Free first session for matched students without a plan.
--
-- A booking made with the free entitlement has is_free_trial = true. While
-- free_trial_released_at is null the booking holds (upcoming) or has consumed
-- (completed, no_show, late cancel) the student's one free session. Releasing
-- it gives the free session back:
--   * student cancels at least 24 hours before start (mirrors CANCEL_REFUND_HOURS)
--   * anyone other than the student cancels (mentor, admin, system)
--   * the mentor doesn't show up
-- The release is stamped by the trigger below, so every cancel path follows
-- the same rule.

ALTER TABLE public.session_bookings
  ADD COLUMN IF NOT EXISTS is_free_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_released_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS session_bookings_one_free_trial
  ON public.session_bookings (student_id)
  WHERE is_free_trial AND free_trial_released_at IS NULL;

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS free_session_modal_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS free_session_modal_shows smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrade_modal_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.session_bookings_entitlement_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged boolean := coalesce(auth.role(), 'service_role') = 'service_role' OR public.is_admin();
  plan text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF privileged THEN
      RETURN NEW;
    END IF;

    NEW.free_trial_released_at := NULL;
    SELECT subscription_status INTO plan FROM public.users WHERE id = NEW.student_id;

    IF NEW.is_free_trial THEN
      IF plan IN ('active', 'free') THEN
        RAISE EXCEPTION 'Free session is only for students without a plan'
          USING ERRCODE = '42501';
      END IF;
      IF EXISTS (
        SELECT 1 FROM public.session_bookings b
        WHERE b.student_id = NEW.student_id
          AND (
            b.status IN ('upcoming', 'completed', 'no_show')
            OR (b.is_free_trial AND b.free_trial_released_at IS NULL)
          )
      ) THEN
        RAISE EXCEPTION 'Free session already used'
          USING ERRCODE = '42501';
      END IF;
    ELSIF plan IS DISTINCT FROM 'active' AND plan IS DISTINCT FROM 'free' THEN
      RAISE EXCEPTION 'A subscription is required to book this session'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NOT privileged THEN
    IF NEW.is_free_trial IS DISTINCT FROM OLD.is_free_trial
      OR NEW.free_trial_released_at IS DISTINCT FROM OLD.free_trial_released_at THEN
      RAISE EXCEPTION 'Only Pupil can change free session fields'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.is_free_trial AND (
      NEW.starts_at IS DISTINCT FROM OLD.starts_at
      OR NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
    ) THEN
      RAISE EXCEPTION 'A free session can''t be moved, cancel it instead'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF OLD.is_free_trial
    AND OLD.free_trial_released_at IS NULL
    AND NEW.free_trial_released_at IS NULL
    AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' AND (
      NEW.cancelled_by IS DISTINCT FROM NEW.student_id
      OR OLD.starts_at - now() >= interval '24 hours'
    ) THEN
      NEW.free_trial_released_at := now();
    ELSIF NEW.status = 'no_show' AND NEW.cancel_reason = 'mentor_no_show' THEN
      NEW.free_trial_released_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.session_bookings_entitlement_guard() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS session_bookings_entitlement_guard ON public.session_bookings;
CREATE TRIGGER session_bookings_entitlement_guard
  BEFORE INSERT OR UPDATE ON public.session_bookings
  FOR EACH ROW EXECUTE FUNCTION public.session_bookings_entitlement_guard();
