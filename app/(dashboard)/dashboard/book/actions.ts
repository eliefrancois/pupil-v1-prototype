'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  ET,
  formatSlot,
  formatSlotTimeOnly,
  normalizeOptIns,
  serializeOptIns,
  validateBookingSlot,
} from '@/lib/scheduling/slots'
import { sendBookingConfirmation } from '@/lib/email/booking'

export type SaveAvailabilityResult =
  | { ok: true }
  | { ok: false; error: string }

export async function saveStudentAvailability(
  slotIds: string[]
): Promise<SaveAvailabilityResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const cleaned = serializeOptIns(slotIds)
  if (cleaned.length === 0) {
    return {
      ok: false,
      error: 'Pick at least one slot you can usually meet.',
    }
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({ availability_slots: cleaned })
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard')
  return { ok: true }
}

export type BookSessionResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string }

export async function bookSession(input: {
  mentorId: string
  startsAtIso: string
}): Promise<BookSessionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const startsAt = new Date(input.startsAtIso)
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: 'Invalid slot.' }
  }
  if (startsAt.getTime() <= Date.now()) {
    return { ok: false, error: 'That slot has already passed.' }
  }

  // Pull the student profile (matched mentor + opt-ins + credit usage).
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select(
      'matched_mentor_id, availability_slots, sessions_total, sessions_used'
    )
    .eq('user_id', user.id)
    .maybeSingle<{
      matched_mentor_id: string | null
      availability_slots: unknown
      sessions_total: number
      sessions_used: number
    }>()

  if (!studentProfile) {
    return { ok: false, error: 'Student profile not found.' }
  }
  if (
    !studentProfile.matched_mentor_id ||
    studentProfile.matched_mentor_id !== input.mentorId
  ) {
    return { ok: false, error: 'You can only book your matched mentor.' }
  }
  if (studentProfile.sessions_used >= studentProfile.sessions_total) {
    return {
      ok: false,
      error: 'You have no session credits remaining this period.',
    }
  }

  const studentOptIns = normalizeOptIns(studentProfile.availability_slots)

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('availability_slots, status')
    .eq('user_id', input.mentorId)
    .maybeSingle<{
      availability_slots: unknown
      status: string
    }>()

  if (!mentorProfile) return { ok: false, error: 'Mentor not found.' }
  if (mentorProfile.status !== 'approved') {
    return {
      ok: false,
      error: 'This mentor isn\u2019t accepting bookings right now.',
    }
  }

  const mentorOptIns = normalizeOptIns(mentorProfile.availability_slots)

  const validation = validateBookingSlot({
    mentorOptIns,
    studentOptIns,
    startsAt,
  })
  if (!validation.valid) {
    return { ok: false, error: validation.reason }
  }

  // Race-condition guard: any active booking already at this start?
  const { data: existing } = await supabase
    .from('session_bookings')
    .select('id')
    .eq('mentor_id', input.mentorId)
    .eq('starts_at', startsAt.toISOString())
    .in('status', ['upcoming', 'completed'])
    .limit(1)

  if (existing && existing.length > 0) {
    return { ok: false, error: 'That slot was just booked.' }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('session_bookings')
    .insert({
      mentor_id: input.mentorId,
      student_id: user.id,
      starts_at: startsAt.toISOString(),
      duration: 30,
      status: 'upcoming',
      slot_index: validation.key.slot,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    // 23505 = unique_violation; the partial unique index caught a race.
    if (insertError?.code === '23505') {
      return { ok: false, error: 'That slot was just booked.' }
    }
    return {
      ok: false,
      error: insertError?.message ?? 'Could not create booking.',
    }
  }

  // Decrement credit. Atomically would be nicer (RPC) but for V0 the read-then-write is fine.
  await supabase
    .from('student_profiles')
    .update({ sessions_used: studentProfile.sessions_used + 1 })
    .eq('user_id', user.id)

  // Fire-and-forget confirmation email. Failure here doesn't break the booking.
  try {
    const [{ data: studentUser }, { data: mentorUser }] = await Promise.all([
      supabase
        .from('users')
        .select('email, full_name')
        .eq('id', user.id)
        .single<{ email: string; full_name: string | null }>(),
      supabase
        .from('users')
        .select('email, full_name')
        .eq('id', input.mentorId)
        .single<{ email: string; full_name: string | null }>(),
    ])

    if (studentUser && mentorUser) {
      await sendBookingConfirmation({
        bookingId: inserted.id,
        startsAt,
        student: { email: studentUser.email, name: studentUser.full_name },
        mentor: { email: mentorUser.email, name: mentorUser.full_name },
      })
    }
  } catch (err) {
    console.warn('[booking] confirmation email failed:', err)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard/history')
  revalidatePath('/mentor')
  revalidatePath('/mentor/mentees')

  return { ok: true, bookingId: inserted.id }
}

/** Helper for client toasts. Pure formatter, no I/O. */
export async function describeSlot(
  startsAtIso: string,
  viewerTz?: string
): Promise<string> {
  const startsAt = new Date(startsAtIso)
  return formatSlot(startsAt, viewerTz ?? ET)
}

export async function describeSlotShort(
  startsAtIso: string,
  viewerTz?: string
): Promise<string> {
  const startsAt = new Date(startsAtIso)
  return formatSlotTimeOnly(startsAt, viewerTz ?? ET)
}
