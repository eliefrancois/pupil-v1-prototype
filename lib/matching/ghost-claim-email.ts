import crypto from 'node:crypto'

import { notifyGhostMentorToClaim } from '@/lib/email/notifications'
import { createServiceClient } from '@/lib/supabase/service'

import { getSiteUrl } from '@/lib/site-url'

const SITE_URL = getSiteUrl()

/**
 * Sends (or re-sends) the ghost mentor claim email. Regenerates the claim
 * token when missing or expired. Called automatically when a student requests
 * a ghost mentor, and can be triggered manually from admin tools.
 */
export async function sendGhostClaimEmail(
  mentorId: string,
  studentName: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServiceClient()

  const { data: mentor } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', mentorId)
    .maybeSingle<{ full_name: string; email: string }>()
  if (!mentor) return { ok: false, error: 'Mentor not found.' }

  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select('claim_status, claim_token, claim_token_expires_at, claim_email_attempts')
    .eq('user_id', mentorId)
    .maybeSingle<{
      claim_status: string
      claim_token: string | null
      claim_token_expires_at: string | null
      claim_email_attempts: number | null
    }>()
  if (!profile) return { ok: false, error: 'Mentor profile not found.' }
  if (profile.claim_status === 'claimed') {
    return { ok: false, error: 'This mentor already claimed their profile.' }
  }

  let token = profile.claim_token
  let needsTokenUpdate = false
  const expiresAt = profile.claim_token_expires_at
    ? new Date(profile.claim_token_expires_at)
    : null
  if (!token || !expiresAt || expiresAt < new Date()) {
    token = crypto.randomBytes(24).toString('base64url')
    needsTokenUpdate = true
  }

  const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const update: Record<string, unknown> = {
    claim_email_sent_at: new Date().toISOString(),
    claim_email_attempts: (profile.claim_email_attempts ?? 0) + 1,
  }
  if (needsTokenUpdate) {
    update.claim_token = token
    update.claim_token_expires_at = newExpiry
  }

  const { error } = await supabase
    .from('mentor_profiles')
    .update(update)
    .eq('user_id', mentorId)
  if (error) return { ok: false, error: 'Could not save claim token.' }

  void notifyGhostMentorToClaim({
    mentorEmail: mentor.email,
    mentorName: mentor.full_name,
    claimUrl: `${SITE_URL}/mentor-claim/${token}`,
    studentName,
  })

  return { ok: true }
}
