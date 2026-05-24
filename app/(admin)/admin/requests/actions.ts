'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  notifyGhostMentorToClaim,
  notifyMentorOfForwardedRequest,
  notifyStudentOfDecline,
} from '@/lib/email/notifications'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Result = { ok: true } | { ok: false; error: string }

async function ensureAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  if (!data || data.role !== 'admin') {
    return { ok: false as const, error: 'Admins only.' }
  }
  return { ok: true as const, supabase, adminId: user.id }
}

/**
 * Admin clicks "Forward to mentor" on a CLAIMED mentor's request.
 * Sets status=forwarded, records the admin who acted, emails the mentor.
 */
export async function forwardRequest(requestId: string): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase, adminId } = auth

  const { data: req } = await supabase
    .from('match_requests')
    .select(
      `id, status, student_message,
       student:users!match_requests_student_id_fkey(full_name, email),
       mentor:users!match_requests_mentor_id_fkey(id, full_name, email)`
    )
    .eq('id', requestId)
    .maybeSingle<{
      id: string
      status: string
      student_message: string | null
      student: { full_name: string; email: string }
      mentor: { id: string; full_name: string; email: string }
    }>()

  if (!req) return { ok: false, error: 'Request not found.' }
  if (req.status !== 'pending') {
    return { ok: false, error: `Cannot forward a request that is ${req.status}.` }
  }

  // Ghost mentors don't have a real session yet, so the "Forward" path
  // doesn't make sense for them. Direct admin to the claim email action.
  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select('claim_status')
    .eq('user_id', req.mentor.id)
    .maybeSingle<{ claim_status: string }>()
  if (profile?.claim_status === 'ghost') {
    return {
      ok: false,
      error: 'This mentor hasn\u2019t claimed their profile yet. Use "Send claim email" first.',
    }
  }

  const { error } = await supabase
    .from('match_requests')
    .update({
      status: 'forwarded',
      forwarded_at: new Date().toISOString(),
      decided_by: adminId,
    })
    .eq('id', requestId)

  if (error) return { ok: false, error: 'Could not update request.' }

  void notifyMentorOfForwardedRequest({
    mentorEmail: req.mentor.email,
    mentorName: req.mentor.full_name,
    studentName: req.student.full_name,
    studentMessage: req.student_message,
  })

  revalidatePath('/admin/requests')
  return { ok: true }
}

export async function declineRequest(
  requestId: string,
  reason: string | null
): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase, adminId } = auth

  const trimmedReason = (reason ?? '').trim().slice(0, 400) || null

  const { data: req } = await supabase
    .from('match_requests')
    .select(
      `id, status,
       student:users!match_requests_student_id_fkey(full_name, email),
       mentor:users!match_requests_mentor_id_fkey(full_name)`
    )
    .eq('id', requestId)
    .maybeSingle<{
      id: string
      status: string
      student: { full_name: string; email: string }
      mentor: { full_name: string }
    }>()

  if (!req) return { ok: false, error: 'Request not found.' }
  if (!['pending', 'forwarded'].includes(req.status)) {
    return { ok: false, error: `Cannot decline a request that is ${req.status}.` }
  }

  const { error } = await supabase
    .from('match_requests')
    .update({
      status: 'declined',
      decided_at: new Date().toISOString(),
      decided_by: adminId,
      decline_reason: trimmedReason,
    })
    .eq('id', requestId)

  if (error) return { ok: false, error: 'Could not update request.' }

  void notifyStudentOfDecline({
    studentEmail: req.student.email,
    studentName: req.student.full_name,
    mentorName: req.mentor.full_name,
    reason: trimmedReason,
  })

  revalidatePath('/admin/requests')
  return { ok: true }
}

/**
 * Sends (or re-sends) the claim email for a ghost mentor. If a specific
 * match request triggered this, we mention the student by name in the
 * email so the mentor knows someone is waiting.
 *
 * Regenerates the claim_token if one isn't present or has expired.
 */
export async function sendClaimEmail(
  mentorId: string,
  triggeringRequestId?: string
): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase } = auth

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

  // Make sure we have a valid token, regenerating if it's missing or stale.
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
  if (error) return { ok: false, error: 'Could not save token.' }

  // Optional: pull the student name from the triggering request for the
  // email copy. Best-effort; the email still sends if this fails.
  let studentName: string | null = null
  if (triggeringRequestId) {
    const { data } = await supabase
      .from('match_requests')
      .select('student:users!match_requests_student_id_fkey(full_name)')
      .eq('id', triggeringRequestId)
      .maybeSingle<{ student: { full_name: string } }>()
    studentName = data?.student.full_name ?? null
  }

  void notifyGhostMentorToClaim({
    mentorEmail: mentor.email,
    mentorName: mentor.full_name,
    claimUrl: `${SITE_URL}/mentor-claim/${token}`,
    studentName,
  })

  revalidatePath('/admin/requests')
  return { ok: true }
}
