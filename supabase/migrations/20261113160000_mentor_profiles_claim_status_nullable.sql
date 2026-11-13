-- Already applied directly to the live DB on 2026-11-13. NULL claim_status
-- means "not a ghost" so the profile drops out of public_mentor_profiles
-- unless status = 'approved'. DROP NOT NULL is a no-op if already nullable.
ALTER TABLE public.mentor_profiles ALTER COLUMN claim_status DROP NOT NULL;
