-- Stripe subscriptions. Stripe is the source of truth for billing; the
-- webhook mirrors it into users.subscription_status. 'free' (eligibility
-- access) is never overwritten by Stripe events.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx
  ON public.users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Processed webhook events, so Stripe retries are no-ops. Service role only.
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

-- "Users can update own data" lets anyone edit their own row, which would
-- include paying themselves. Billing fields and role are server-only.
CREATE OR REPLACE FUNCTION public.users_guard_billing_fields()
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
    NEW.subscription_status := 'inactive';
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_session_id := NULL;
    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
    OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only Pupil can change billing or role fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.users_guard_billing_fields() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS users_guard_billing_fields ON public.users;
CREATE TRIGGER users_guard_billing_fields
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_guard_billing_fields();
