'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  ET,
  formatSlot,
  formatSlotTimeOnly,
  normalizeOptIns,
  validateBookingSlot,
} from '@/lib/scheduling/slots'
import { sendBookingConfirmation } from '@/lib/email/booking'
import { captureServerEvent } from '@/lib/analytics/server'
import { getStudentEntitlements } from '@/lib/entitlements'

export type BookSessionResult =
  | { ok: true; bookingId: string; isFreeSession: boolean }
  | { ok: false; error: string; code?: 'upgrade_required' }

const UPGRADE_REQUIRED = {
  ok: false,
  error: 'You\u2019ve used your free session. Subscribe to book more.',
  code: 'upgrade_required',
} as const

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

  const entitlements = await getStudentEntitlements(user.id, supabase)

  if (!entitlements.isMatched || entitlements.mentorId !== input.mentorId) {
    return { ok: false, error: 'You can only book your matched mentor.' }
  }
  if (!entitlements.canBook) return UPGRADE_REQUIRED
  const isFreeSession = entitlements.canBookFreeSession
  if (!isFreeSession && entitlements.sessionsRemaining === 0) {
    return {
      ok: false,
      error: 'You have no session credits remaining this period.',
    }
  }

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
      is_free_trial: isFreeSession,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    // 23505 = unique_violation; a partial unique index caught a race.
    if (insertError?.code === '23505') {
      if (insertError.message.includes('session_bookings_one_free_trial')) {
        return UPGRADE_REQUIRED
      }
      return { ok: false, error: 'That slot was just booked.' }
    }
    // 42501 = the entitlement guard trigger refused the booking.
    if (insertError?.code === '42501') return UPGRADE_REQUIRED
    return {
      ok: false,
      error: insertError?.message ?? 'Could not create booking.',
    }
  }

  // Plan credit only; the free session doesn't touch sessions_used.
  if (!isFreeSession) {
    const { data: usage } = await supabase
      .from('student_profiles')
      .select('sessions_used')
      .eq('user_id', user.id)
      .maybeSingle<{ sessions_used: number }>()
    await supabase
      .from('student_profiles')
      .update({ sessions_used: (usage?.sessions_used ?? 0) + 1 })
      .eq('user_id', user.id)
  }

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

  await captureServerEvent(user.id, 'session_booked', {
    booking_id: inserted.id,
    mentor_id: input.mentorId,
    is_free_session: isFreeSession,
  })
  if (isFreeSession) {
    await captureServerEvent(user.id, 'free_session_booked', {
      booking_id: inserted.id,
      mentor_id: input.mentorId,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard/history')
  revalidatePath('/mentor')
  revalidatePath('/mentor/mentees')

  return { ok: true, bookingId: inserted.id, isFreeSession }
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
