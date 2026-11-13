-- Claim campaign: three emails to imported (ghost) mentors, then auto-hide.
-- claim_campaign_step counts campaign emails sent (0-3). The opt-out token is
-- separate from claim_token so "remove me" links keep working after a claim
-- link expires or is rotated.
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS claim_campaign_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claim_campaign_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_optout_token text
    UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');
