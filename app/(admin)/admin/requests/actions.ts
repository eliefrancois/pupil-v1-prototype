'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { sendGhostClaimEmail } from '@/lib/matching/ghost-claim-email'
import {
  notifyMentorOfForwardedRequest,
  notifyStudentOfDecline,
} from '@/lib/email/notifications'

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

/** @deprecated Matching queue is the primary workflow. Kept for legacy routes. */
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

  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select('claim_status')
    .eq('user_id', req.mentor.id)
    .maybeSingle<{ claim_status: string }>()
  if (profile?.claim_status === 'ghost') {
    return {
      ok: false,
      error:
        'This mentor hasn\u2019t claimed their profile yet. Claim emails are sent automatically when students request them.',
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

  revalidatePath('/admin/matching')
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

  revalidatePath('/admin/matching')
  return { ok: true }
}

export async function sendClaimEmail(
  mentorId: string,
  triggeringRequestId?: string
): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase } = auth

  let studentName: string | null = null
  if (triggeringRequestId) {
    const { data } = await supabase
      .from('match_requests')
      .select('student:users!match_requests_student_id_fkey(full_name)')
      .eq('id', triggeringRequestId)
      .maybeSingle<{ student: { full_name: string } }>()
    studentName = data?.student.full_name ?? null
  }

  const result = await sendGhostClaimEmail(mentorId, studentName)
  if (!result.ok) return result

  revalidatePath('/admin/matching')
  return { ok: true }
}
