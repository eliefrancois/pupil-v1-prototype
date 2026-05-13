'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type SubmitRatingResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Student-side rating of a completed session.
 *
 * Writes/updates the `ratings` row keyed by `(session_id, from_user_id)`.
 * Idempotent on re-submit so the student can change their mind. Mentor-side
 * rating-of-student is intentionally not wired for V0; the table is already
 * bidirectional (`to_user_id`) so we can add it later without a migration.
 */
export async function submitRating(input: {
  bookingId: string
  score: number
}): Promise<SubmitRatingResult> {
  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5 stars.' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: booking } = await supabase
    .from('session_bookings')
    .select('id, mentor_id, student_id, status')
    .eq('id', input.bookingId)
    .maybeSingle<{
      id: string
      mentor_id: string
      student_id: string
      status: string
    }>()

  if (!booking) return { ok: false, error: 'Session not found.' }
  if (booking.student_id !== user.id) {
    return { ok: false, error: 'Only the student can rate this session.' }
  }
  if (booking.status !== 'completed') {
    return {
      ok: false,
      error: 'You can only rate a completed session.',
    }
  }

  // Upsert by (session_id, from_user_id). The ratings table doesn't have a
  // unique constraint on those today, so we do a manual lookup-then-update
  // to stay idempotent.
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('session_id', booking.id)
    .eq('from_user_id', user.id)
    .maybeSingle<{ id: string }>()

  if (existing) {
    const { error } = await supabase
      .from('ratings')
      .update({ score: input.score })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('ratings').insert({
      session_id: booking.id,
      from_user_id: user.id,
      to_user_id: booking.mentor_id,
      score: input.score,
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/session/${booking.id}/breakdown`)
  revalidatePath(`/mentor/session/${booking.id}/breakdown`)

  return { ok: true }
}
