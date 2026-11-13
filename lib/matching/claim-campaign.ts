import crypto from 'node:crypto'

import type { ClaimCampaignStep } from '@/emails/mentor-claim-campaign'
import { notifyGhostMentorClaimCampaign } from '@/lib/email/notifications'
import { getSiteUrl } from '@/lib/site-url'
import { createServiceClient } from '@/lib/supabase/service'

const DAY_MS = 24 * 60 * 60 * 1000
const DAYS_BEFORE_SECOND_EMAIL = 7
const DAYS_BEFORE_FINAL_EMAIL = 14
const DAYS_BEFORE_HIDE = 9
const CLAIM_LINK_DAYS = 30
// Resend's default rate limit is 2 requests per second.
const SEND_SPACING_MS = 600

interface DueMentor {
  user_id: string
  claim_campaign_step: number
  claim_token: string | null
  claim_token_expires_at: string | null
  claim_optout_token: string
  claim_email_attempts: number
  users: { email: string; full_name: string }
}

export interface ClaimCampaignResult {
  mode: 'live' | 'dry_run'
  hidden: number
  sent: number
  failed: number
  due: { email: string; step: ClaimCampaignStep }[]
}

/**
 * Three claim emails to each imported (ghost) mentor: day 0, day 7, day 21.
 * Profiles still unclaimed 9 days after the final email are paused and lose
 * the ghost flag, which takes them off the public directory.
 *
 * Mentors who claim, opt out, or get hidden by an admin drop out because
 * their claim_status is no longer 'ghost'.
 */
export async function runClaimCampaign({
  live,
  limit,
}: {
  live: boolean
  limit: number
}): Promise<ClaimCampaignResult> {
  const supabase = createServiceClient()
  const now = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString()

  const hideCutoff = iso(now - DAYS_BEFORE_HIDE * DAY_MS)
  const { data: toHide, error: hideLookupError } = await supabase
    .from('mentor_profiles')
    .select('user_id')
    .eq('claim_status', 'ghost')
    .eq('claim_campaign_step', 3)
    .lte('claim_campaign_sent_at', hideCutoff)
  if (hideLookupError) throw new Error(hideLookupError.message)

  let hidden = 0
  if (live && toHide && toHide.length > 0) {
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ status: 'paused', claim_status: null })
      .in(
        'user_id',
        toHide.map((row) => row.user_id)
      )
      .eq('claim_status', 'ghost')
    if (error) throw new Error(error.message)
    hidden = toHide.length
  }

  const secondCutoff = iso(now - DAYS_BEFORE_SECOND_EMAIL * DAY_MS)
  const finalCutoff = iso(now - DAYS_BEFORE_FINAL_EMAIL * DAY_MS)
  const { data: due, error: dueError } = await supabase
    .from('mentor_profiles')
    .select(
      'user_id, claim_campaign_step, claim_token, claim_token_expires_at, claim_optout_token, claim_email_attempts, users:users!mentor_profiles_user_id_fkey!inner(email, full_name)'
    )
    .eq('claim_status', 'ghost')
    .or(
      [
        'claim_campaign_step.eq.0',
        `and(claim_campaign_step.eq.1,claim_campaign_sent_at.lte."${secondCutoff}")`,
        `and(claim_campaign_step.eq.2,claim_campaign_sent_at.lte."${finalCutoff}")`,
      ].join(',')
    )
    .order('claim_campaign_step', { ascending: false })
    .order('user_id')
    .limit(limit)
    .returns<DueMentor[]>()
  if (dueError) throw new Error(dueError.message)

  const dueList = (due ?? []).map((mentor) => ({
    email: mentor.users.email,
    step: (mentor.claim_campaign_step + 1) as ClaimCampaignStep,
  }))

  if (!live) {
    return {
      mode: 'dry_run',
      hidden: toHide?.length ?? 0,
      sent: 0,
      failed: 0,
      due: dueList,
    }
  }

  const siteUrl = getSiteUrl()
  const hideDate = new Date(now + DAYS_BEFORE_HIDE * DAY_MS).toLocaleDateString(
    'en-US',
    { month: 'long', day: 'numeric', timeZone: 'America/New_York' }
  )

  let sent = 0
  let failed = 0
  for (const mentor of due ?? []) {
    const step = (mentor.claim_campaign_step + 1) as ClaimCampaignStep

    // Keep the same token across all three emails so links in earlier emails
    // still work; only push the expiry out so it outlives the hide date.
    const token = mentor.claim_token ?? crypto.randomBytes(24).toString('base64url')
    const expiresAt = mentor.claim_token_expires_at
      ? new Date(mentor.claim_token_expires_at).getTime()
      : 0
    if (!mentor.claim_token || expiresAt < now + (DAYS_BEFORE_HIDE + 1) * DAY_MS) {
      const { error } = await supabase
        .from('mentor_profiles')
        .update({
          claim_token: token,
          claim_token_expires_at: iso(now + CLAIM_LINK_DAYS * DAY_MS),
        })
        .eq('user_id', mentor.user_id)
      if (error) {
        failed++
        continue
      }
    }

    const ok = await notifyGhostMentorClaimCampaign({
      step,
      mentorEmail: mentor.users.email,
      mentorName: mentor.users.full_name,
      claimUrl: `${siteUrl}/mentor-claim/${token}`,
      optOutUrl: `${siteUrl}/mentor-optout/${mentor.claim_optout_token}`,
      hideDate,
    })

    if (ok) {
      const sentAt = new Date().toISOString()
      await supabase
        .from('mentor_profiles')
        .update({
          claim_campaign_step: step,
          claim_campaign_sent_at: sentAt,
          claim_email_sent_at: sentAt,
          claim_email_attempts: mentor.claim_email_attempts + 1,
        })
        .eq('user_id', mentor.user_id)
      sent++
    } else {
      failed++
    }

    await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS))
  }

  return { mode: 'live', hidden, sent, failed, due: dueList }
}
