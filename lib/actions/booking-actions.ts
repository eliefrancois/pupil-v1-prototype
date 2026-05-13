'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { CANCEL_REFUND_HOURS } from '@/lib/scheduling/canonical-slots'

export type CancelBookingResult =
  | { ok: true; refunded: boolean }
  | { ok: false; error: string }

export async function cancelBooking(input: {
  bookingId: string
  reason?: string
}): Promise<CancelBookingResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: booking, error: fetchError } = await supabase
    .from('session_bookings')
    .select('id, mentor_id, student_id, starts_at, status')
    .eq('id', input.bookingId)
    .single<{
      id: string
      mentor_id: string
      student_id: string
      starts_at: string
      status: string
    }>()

  if (fetchError || !booking) {
    return { ok: false, error: 'Booking not found.' }
  }

  if (
    booking.mentor_id !== user.id &&
    booking.student_id !== user.id
  ) {
    return { ok: false, error: 'You can\u2019t cancel this booking.' }
  }

  if (booking.status !== 'upcoming') {
    return { ok: false, error: `Already ${booking.status}.` }
  }

  const startsAt = new Date(booking.starts_at)
  const hoursUntil = (startsAt.getTime() - Date.now()) / (1000 * 60 * 60)
  const refund = hoursUntil >= CANCEL_REFUND_HOURS

  const { error: updateError } = await supabase
    .from('session_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancel_reason: input.reason ?? null,
    })
    .eq('id', booking.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  if (refund) {
    // Decrement the student's used count, floor at 0.
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('sessions_used')
      .eq('user_id', booking.student_id)
      .maybeSingle<{ sessions_used: number }>()

    const next = Math.max(0, (profile?.sessions_used ?? 0) - 1)
    await supabase
      .from('student_profiles')
      .update({ sessions_used: next })
      .eq('user_id', booking.student_id)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard/session')
  revalidatePath(`/dashboard/session/${booking.id}`)
  revalidatePath('/mentor')
  revalidatePath('/mentor/mentees')
  revalidatePath(`/mentor/session/${booking.id}`)

  return { ok: true, refunded: refund }
}
