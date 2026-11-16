-- Students may update their own profile, but the match fields are admin-only.
-- The service role (cron jobs, server actions using the service client) and
-- admins pass through; everyone else gets an error if they touch them.
CREATE OR REPLACE FUNCTION public.student_profiles_guard_match_fields()
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
    IF NEW.matched_mentor_id IS NOT NULL
      OR NEW.needs_rematch_at IS NOT NULL
      OR NEW.rematch_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can set a student''s mentor match'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.matched_mentor_id IS DISTINCT FROM OLD.matched_mentor_id
    OR NEW.matched_at IS DISTINCT FROM OLD.matched_at
    OR NEW.needs_rematch_at IS DISTINCT FROM OLD.needs_rematch_at
    OR NEW.rematch_reason IS DISTINCT FROM OLD.rematch_reason THEN
    RAISE EXCEPTION 'Only admins can change a student''s mentor match'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.student_profiles_guard_match_fields() FROM public, anon, authenticated;

-- Named to sort before student_profiles_track_match so it sees the client's
-- values before that trigger stamps matched_at.
DROP TRIGGER IF EXISTS student_profiles_guard_match_fields ON public.student_profiles;
CREATE TRIGGER student_profiles_guard_match_fields
  BEFORE INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.student_profiles_guard_match_fields();
