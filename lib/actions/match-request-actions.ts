'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyAdminOfMatchRequest } from '@/lib/email/notifications'

/**
 * Student-side match request flow.
 *
 * Constraints enforced here:
 *  - Caller must be authenticated and have role='student'
 *  - Max 5 outstanding (pending|forwarded) requests per student
 *  - Cannot request the same mentor twice while another request is active
 *
 * The DB has a partial unique index on (student_id, mentor_id) where
 * status IN ('pending','forwarded','accepted') as a backstop.
 */

const MAX_OUTSTANDING_REQUESTS = 5
const MESSAGE_MAX_CHARS = 500

type ActionResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string; code?: 'unauthenticated' | 'not_student' | 'cap_reached' | 'duplicate' | 'unknown' }

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

  // Verify the caller is a student. Don't trust client-side role hints.
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()

  if (!caller || caller.role !== 'student') {
    return {
      ok: false,
      error: 'Only students can request a mentor match.',
      code: 'not_student',
    }
  }

  // Outstanding request cap.
  const { count: outstandingCount } = await supabase
    .from('match_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .in('status', ['pending', 'forwarded'])

  if ((outstandingCount ?? 0) >= MAX_OUTSTANDING_REQUESTS) {
    return {
      ok: false,
      error: `You already have ${MAX_OUTSTANDING_REQUESTS} pending requests. Wait for an admin to action them or cancel one before adding another.`,
      code: 'cap_reached',
    }
  }

  // Active duplicate check (the DB has a partial unique index, but a
  // friendly message here beats catching a constraint error).
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

  // Insert.
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
    // Most likely the partial unique index caught a race; surface a clean
    // message rather than the raw constraint name.
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

  // Fire admin notification. Don't fail the whole action if the email
  // provider hiccups — the request is already saved.
  void sendAdminNotification(supabase, user.id, mentorId, inserted.id, trimmed)

  revalidatePath('/dashboard')
  revalidatePath(`/mentors/${mentorId}`)
  return { ok: true, requestId: inserted.id }
}

async function sendAdminNotification(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  mentorId: string,
  requestId: string,
  message: string
) {
  try {
    const [studentRes, studentProfileRes, mentorRes, mentorProfileRes] =
      await Promise.all([
        supabase
          .from('users')
          .select('full_name, email')
          .eq('id', studentId)
          .maybeSingle<{ full_name: string; email: string }>(),
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

    const student = studentRes.data
    const mentor = mentorRes.data
    if (!student || !mentor) return

    await notifyAdminOfMatchRequest({
      studentName: student.full_name,
      studentEmail: student.email,
      studentGrade: studentProfileRes.data?.grade ?? null,
      mentorName: mentor.full_name,
      mentorIsGhost: mentorProfileRes.data?.claim_status === 'ghost',
      message: message || null,
      requestId,
    })
  } catch (err) {
    console.error('[match-request] admin notification failed:', err)
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
  revalidatePath(`/mentors/${req.mentor_id}`)
  return { ok: true }
}
