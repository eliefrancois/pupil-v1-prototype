'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  notifyMentorAssigned,
  notifyStudentMatched,
} from '@/lib/email/notifications'
import { isMentorAssignableForMatch } from '@/lib/matching/mentor-eligibility'
import { normalizeOptIns } from '@/lib/scheduling/slots'

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
 * Admin assigns (or reassigns) a mentor to a student from the matching queue.
 * On assign: closes open match requests silently, emails student + mentor.
 */
export async function assignStudentMentor({
  studentId,
  mentorId,
}: {
  studentId: string
  mentorId: string | null
}): Promise<Result> {
  if (!studentId) return { ok: false, error: 'Missing student id.' }

  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase, adminId } = auth

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('matched_mentor_id')
    .eq('user_id', studentId)
    .maybeSingle<{ matched_mentor_id: string | null }>()
  if (!studentProfile) return { ok: false, error: 'Student not found.' }

  const previousMentorId = studentProfile.matched_mentor_id

  if (mentorId === previousMentorId) {
    return { ok: true }
  }

  const { data: updated, error: updateError } = await supabase
    .from('student_profiles')
    .update({ matched_mentor_id: mentorId })
    .eq('user_id', studentId)
    .select('user_id, matched_mentor_id')

  if (updateError) return { ok: false, error: updateError.message }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error:
        'No row was updated. Check that the admin policy on student_profiles allows UPDATE.',
    }
  }

  if (mentorId) {
    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('claim_status, availability_slots, status')
      .eq('user_id', mentorId)
      .maybeSingle<{
        claim_status: string | null
        availability_slots: unknown
        status: string
      }>()

    if (!mentorProfile || mentorProfile.status !== 'approved') {
      return { ok: false, error: 'That mentor is not approved.' }
    }

    const slotCount = normalizeOptIns(mentorProfile.availability_slots).size
    if (
      !isMentorAssignableForMatch({
        claimStatus: mentorProfile.claim_status,
        availabilitySlotCount: slotCount,
      })
    ) {
      if (mentorProfile.claim_status === 'ghost') {
        return {
          ok: false,
          error:
            'Ghost mentors cannot be assigned until they claim their profile on Pupil.',
        }
      }
      return {
        ok: false,
        error:
          'That mentor has not set availability yet. They need at least one weekly slot before assignment.',
      }
    }

    const now = new Date().toISOString()
    await supabase
      .from('match_requests')
      .update({
        status: 'cancelled',
        decided_at: now,
        decided_by: adminId,
      })
      .eq('student_id', studentId)
      .in('status', ['pending', 'forwarded'])

    void sendMatchNotifications(supabase, studentId, mentorId)
  }

  revalidatePath('/admin/matching')
  revalidatePath('/admin/students')
  revalidatePath('/dashboard')
  return { ok: true }
}

async function sendMatchNotifications(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  mentorId: string
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
          .select('full_name, email')
          .eq('id', mentorId)
          .maybeSingle<{ full_name: string; email: string }>(),
        supabase
          .from('mentor_profiles')
          .select('university')
          .eq('user_id', mentorId)
          .maybeSingle<{ university: string }>(),
      ])

    const student = studentRes.data
    const mentor = mentorRes.data
    if (!student || !mentor) return

    await Promise.all([
      notifyStudentMatched({
        studentEmail: student.email,
        studentName: student.full_name,
        mentorName: mentor.full_name,
        mentorUniversity: mentorProfileRes.data?.university ?? null,
      }),
      notifyMentorAssigned({
        mentorEmail: mentor.email,
        mentorName: mentor.full_name,
        studentName: student.full_name,
        studentGrade: studentProfileRes.data?.grade ?? null,
      }),
    ])
  } catch (err) {
    console.error('[admin-matching] match notification failed:', err)
  }
}
