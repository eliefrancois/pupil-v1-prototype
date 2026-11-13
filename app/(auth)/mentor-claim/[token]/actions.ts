'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'

import { notifyGhostMentorToClaim } from '@/lib/email/notifications'
import { getSiteUrl } from '@/lib/site-url'

/**
 * The claim flow turns a ghost mentor (imported via CSV with no password,
 * email_confirmed_at = null) into a real, signed-in mentor.
 *
 * Steps:
 *   1. Re-verify the token against mentor_profiles (anything client-side
 *      could be spoofed).
 *   2. Use the admin API to set the user's password + confirm their email.
 *   3. Flip claim_status -> 'claimed', record claimed_at, null the token.
 *
 * The client then calls supabase.auth.signInWithPassword with the same
 * password to establish a session. We do not return the password to the
 * client; the client already has it from the form.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      'Supabase service credentials missing. Set SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  return createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type ClaimResult =
  | { ok: true; email: string }
  | { ok: false; error: string }

export async function claimProfile(
  token: string,
  password: string
): Promise<ClaimResult> {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Missing claim token.' }
  }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = getServiceClient()

  // 1. Look up the profile by token.
  const { data: profile, error: lookupErr } = await supabase
    .from('mentor_profiles')
    .select('user_id, claim_status, claim_token_expires_at')
    .eq('claim_token', token)
    .maybeSingle<{
      user_id: string
      claim_status: string
      claim_token_expires_at: string | null
    }>()

  if (lookupErr) {
    return { ok: false, error: 'Could not verify your link. Try again.' }
  }
  if (!profile) {
    return { ok: false, error: 'This claim link is invalid.' }
  }
  if (profile.claim_status === 'claimed') {
    return {
      ok: false,
      error: 'This profile has already been claimed. Try logging in.',
    }
  }
  if (
    profile.claim_token_expires_at &&
    new Date(profile.claim_token_expires_at) < new Date()
  ) {
    return {
      ok: false,
      error: 'This claim link has expired. Request a fresh one.',
    }
  }

  // 2. Set the password + confirm the email on the auth user.
  const { data: updated, error: authErr } =
    await supabase.auth.admin.updateUserById(profile.user_id, {
      password,
      email_confirm: true,
    })
  if (authErr || !updated.user?.email) {
    return {
      ok: false,
      error: 'Could not finalize your account. Please try again.',
    }
  }

  // 3. Mark the profile claimed and clear the one-time token.
  const { error: updateErr } = await supabase
    .from('mentor_profiles')
    .update({
      claim_status: 'claimed',
      claimed_at: new Date().toISOString(),
      claim_token: null,
    })
    .eq('user_id', profile.user_id)

  if (updateErr) {
    // Roll back the auth state? In practice the password is set; user can
    // still log in. The next claim attempt will fail with 'claimed', which
    // is the right state. Surface the error so admins can re-investigate.
    return {
      ok: false,
      error:
        'Account was created but profile finalization failed. Contact support.',
    }
  }

  return { ok: true, email: updated.user.email }
}

/**
 * Re-opens an expired claim link for another 30 days and emails it to the
 * mentor. Triggered from the "Send me a new link" button on the expired-state
 * UI. The token stays the same so links in earlier emails keep working.
 */
export async function regenerateClaimToken(
  oldToken: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  if (!oldToken) return { ok: false, error: 'Missing token.' }

  const supabase = getServiceClient()

  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select(
      'user_id, claim_status, claim_email_attempts, users:users!mentor_profiles_user_id_fkey!inner(email, full_name)'
    )
    .eq('claim_token', oldToken)
    .maybeSingle<{
      user_id: string
      claim_status: string
      claim_email_attempts: number
      users: { email: string; full_name: string }
    }>()

  if (!profile) return { ok: false, error: 'Link not recognized.' }
  if (profile.claim_status === 'claimed') {
    return {
      ok: false,
      error: 'This profile is already claimed. Try logging in.',
    }
  }

  if (profile.claim_status !== 'ghost' && profile.claim_status !== 'claim_pending') {
    return { ok: false, error: 'This link is no longer active.' }
  }

  const newExpiry = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error } = await supabase
    .from('mentor_profiles')
    .update({
      claim_token_expires_at: newExpiry,
      claim_email_sent_at: new Date().toISOString(),
      claim_email_attempts: profile.claim_email_attempts + 1,
    })
    .eq('user_id', profile.user_id)

  if (error) return { ok: false, error: 'Could not refresh your link.' }

  await notifyGhostMentorToClaim({
    mentorEmail: profile.users.email,
    mentorName: profile.users.full_name,
    claimUrl: `${getSiteUrl()}/mentor-claim/${oldToken}`,
    studentName: null,
  })

  return { ok: true, email: profile.users.email }
}
