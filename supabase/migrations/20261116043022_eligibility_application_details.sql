-- Fields the /access free-access form needs to be real: who applied, their
-- consent to contact the counselor, whether the counselor email went out,
-- and who reviewed the application.
ALTER TABLE public.eligibility_applications
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS counselor_emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS granted_user_id uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS eligibility_applications_created_at_idx
  ON public.eligibility_applications (created_at DESC);
