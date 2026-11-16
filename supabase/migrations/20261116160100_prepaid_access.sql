-- One-time prepaid plans (e.g. Pupil Premier, 2 years). The webhook sets
-- prepaid_access_ends_at from the Stripe price's pupil_access_months metadata.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text,
  ADD COLUMN IF NOT EXISTS prepaid_access_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS prepaid_plan text;

-- Mirrors planFromBilling() in lib/billing/access.ts.
CREATE OR REPLACE FUNCTION public.user_plan(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN u.subscription_status = 'free' THEN 'free_access'
    WHEN u.subscription_status = 'active' AND (
      u.prepaid_access_ends_at IS NULL
      OR u.prepaid_access_ends_at > now()
      OR u.stripe_subscription_status IN ('active', 'trialing', 'past_due')
    ) THEN 'subscribed'
    ELSE 'none'
  END
  FROM public.users u
  WHERE u.id = p_user_id
$$;

REVOKE EXECUTE ON FUNCTION public.user_plan(uuid) FROM PUBLIC, anon, authenticated;

-- Run hourly from /api/cron/reminders.
CREATE OR REPLACE FUNCTION public.expire_prepaid_access()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expired AS (
    UPDATE public.users
    SET subscription_status = 'inactive', updated_at = now()
    WHERE subscription_status = 'active'
      AND prepaid_access_ends_at <= now()
      AND coalesce(stripe_subscription_status, '') NOT IN ('active', 'trialing', 'past_due')
    RETURNING 1
  )
  SELECT count(*)::integer FROM expired
$$;

REVOKE EXECUTE ON FUNCTION public.expire_prepaid_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_prepaid_access() TO service_role;

-- Prepaid fields come only from Stripe via the service role, not even admins.
CREATE OR REPLACE FUNCTION public.users_guard_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_service boolean := coalesce(auth.role(), 'service_role') = 'service_role';
BEGIN
  IF NOT is_service THEN
    IF TG_OP = 'INSERT' THEN
      NEW.prepaid_access_ends_at := NULL;
      NEW.prepaid_plan := NULL;
    ELSIF NEW.prepaid_access_ends_at IS DISTINCT FROM OLD.prepaid_access_ends_at
      OR NEW.prepaid_plan IS DISTINCT FROM OLD.prepaid_plan THEN
      RAISE EXCEPTION 'Prepaid access is set from Stripe' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF is_service OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_status := 'inactive';
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_subscription_status := NULL;
    NEW.stripe_session_id := NULL;
    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.stripe_subscription_status IS DISTINCT FROM OLD.stripe_subscription_status
    OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
    OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only Pupil can change billing or role fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Booking entitlement uses user_plan() so an expired prepaid plan stops
-- paid bookings right away.
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
    plan := coalesce(public.user_plan(NEW.student_id), 'none');

    IF NEW.is_free_trial THEN
      IF plan <> 'none' THEN
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
    ELSIF plan = 'none' THEN
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
