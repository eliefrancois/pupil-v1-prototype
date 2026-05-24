'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MAX_MATCH_REQUESTS } from '@/lib/constants'
import { sendGhostClaimEmail } from '@/lib/matching/ghost-claim-email'
import { notifyAdminOfMatchRequest } from '@/lib/email/notifications'

/**
 * Student-side match request flow.
 *
 * Constraints enforced here:
 *  - Caller must be authenticated and have role='student'
 *  - Max 5 outstanding (pending|forwarded) requests per student
 *  - Cannot request the same mentor twice while another request is active
 *  - Ghost mentors: claim email sent automatically on request
 *
 * The DB has a partial unique index on (student_id, mentor_id) where
 * status IN ('pending','forwarded','accepted') as a backstop.
 */

const MESSAGE_MAX_CHARS = 500

type ActionResult =
  | { ok: true; requestId: string; remaining: number }
  | {
      ok: false
      error: string
      code?: 'unauthenticated' | 'not_student' | 'cap_reached' | 'duplicate' | 'unknown'
    }

export async function createMatchRequest({
  mentorId,
  message,
}: {
  mentorId: string
  message?: string
}): Promise<ActionResult> {
  if (!mentorId) return { ok: false, error: 'Mentor not specified.' }

  const trimmed = (message ?? '').trim().slice(0, MESSAGE_MAX_CHARS)

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      error: 'You need to log in before you can request a match.',
      code: 'unauthenticated',
    }
  }

  const { data: caller } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle<{ role: string; full_name: string }>()

  if (!caller || caller.role !== 'student') {
    return {
      ok: false,
      error: 'Only students can request a mentor match.',
      code: 'not_student',
    }
  }

  const { count: outstandingCount } = await supabase
    .from('match_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .in('status', ['pending', 'forwarded'])

  if ((outstandingCount ?? 0) >= MAX_MATCH_REQUESTS) {
    return {
      ok: false,
      error: `You have no match requests left (${MAX_MATCH_REQUESTS} max). Cancel one on your dashboard or wait until you're matched.`,
      code: 'cap_reached',
    }
  }

  const { data: duplicate } = await supabase
    .from('match_requests')
    .select('id')
    .eq('student_id', user.id)
    .eq('mentor_id', mentorId)
    .in('status', ['pending', 'forwarded', 'accepted'])
    .maybeSingle<{ id: string }>()

  if (duplicate) {
    return {
      ok: false,
      error: 'You already have an active request for this mentor.',
      code: 'duplicate',
    }
  }

  const { data: inserted, error } = await supabase
    .from('match_requests')
    .insert({
      student_id: user.id,
      mentor_id: mentorId,
      status: 'pending',
      student_message: trimmed || null,
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !inserted) {
    if (error?.code === '23505') {
      return {
        ok: false,
        error: 'You already have an active request for this mentor.',
        code: 'duplicate',
      }
    }
    return {
      ok: false,
      error: 'Could not save your request. Please try again.',
      code: 'unknown',
    }
  }

  const remaining = Math.max(
    0,
    MAX_MATCH_REQUESTS - ((outstandingCount ?? 0) + 1)
  )

  void afterRequestCreated(
    supabase,
    user.id,
    caller.full_name,
    mentorId,
    inserted.id,
    trimmed
  )

  revalidatePath('/dashboard')
  revalidatePath('/admin/matching')
  revalidatePath(`/mentors/${mentorId}`)
  return { ok: true, requestId: inserted.id, remaining }
}

async function afterRequestCreated(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  studentName: string,
  mentorId: string,
  requestId: string,
  message: string
) {
  try {
    const [studentProfileRes, mentorRes, mentorProfileRes] = await Promise.all([
      supabase
        .from('student_profiles')
        .select('grade')
        .eq('user_id', studentId)
        .maybeSingle<{ grade: number | null }>(),
      supabase
        .from('users')
        .select('full_name')
        .eq('id', mentorId)
        .maybeSingle<{ full_name: string }>(),
      supabase
        .from('mentor_profiles')
        .select('claim_status')
        .eq('user_id', mentorId)
        .maybeSingle<{ claim_status: string }>(),
    ])

    const mentor = mentorRes.data
    if (!mentor) return

    const isGhost = mentorProfileRes.data?.claim_status === 'ghost'

    const { data: studentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', studentId)
      .maybeSingle<{ email: string }>()

    await notifyAdminOfMatchRequest({
      studentName,
      studentEmail: studentUser?.email ?? '',
      studentGrade: studentProfileRes.data?.grade ?? null,
      mentorName: mentor.full_name,
      mentorIsGhost: isGhost,
      message: message || null,
      requestId,
    })

    if (isGhost) {
      const claimResult = await sendGhostClaimEmail(mentorId, studentName)
      if (!claimResult.ok) {
        console.error('[match-request] ghost claim email failed:', claimResult.error)
      }
    }
  } catch (err) {
    console.error('[match-request] post-create hooks failed:', err)
  }
}

export async function cancelMatchRequest(
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!requestId) return { ok: false, error: 'Missing request id.' }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in.' }

  const { data: req } = await supabase
    .from('match_requests')
    .select('id, mentor_id, status')
    .eq('id', requestId)
    .eq('student_id', user.id)
    .maybeSingle<{ id: string; mentor_id: string; status: string }>()

  if (!req) {
    return { ok: false, error: 'Request not found.' }
  }
  if (!['pending', 'forwarded'].includes(req.status)) {
    return {
      ok: false,
      error: 'This request can no longer be cancelled.',
    }
  }

  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'cancelled', decided_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) return { ok: false, error: 'Could not cancel your request.' }

  revalidatePath('/dashboard')
  revalidatePath('/admin/matching')
  revalidatePath(`/mentors/${req.mentor_id}`)
  return { ok: true }
}
