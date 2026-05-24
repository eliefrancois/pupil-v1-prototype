'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { computeRatingWindow } from '@/lib/scheduling/rating-window'

export type SubmitRatingResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Student-side rating of a completed session.
 *
 * Permanent on first submit: once a `ratings` row exists for
 * `(session_id, from_user_id)`, we reject further updates. Students have
 * a 24h window after the session ends to submit; after that, the window
 * closes and no new ratings are accepted.
 *
 * Mentor-side rating-of-student is intentionally not wired for V0; the
 * table is bidirectional (`to_user_id`) so we can add it later.
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
    .select('id, mentor_id, student_id, status, starts_at, duration, ended_at')
    .eq('id', input.bookingId)
    .maybeSingle<{
      id: string
      mentor_id: string
      student_id: string
      status: string
      starts_at: string
      duration: number | null
      ended_at: string | null
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

  const window = computeRatingWindow(booking)
  if (!window.isOpen) {
    return {
      ok: false,
      error: 'The rating window for this session has closed.',
    }
  }

  // Ratings are locked once submitted. If a row already exists for this
  // (session, rater), reject the change.
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('session_id', booking.id)
    .eq('from_user_id', user.id)
    .maybeSingle<{ id: string }>()

  if (existing) {
    return {
      ok: false,
      error: 'You have already rated this session. Ratings can\u2019t be changed.',
    }
  }

  const { error } = await supabase.from('ratings').insert({
    session_id: booking.id,
    from_user_id: user.id,
    to_user_id: booking.mentor_id,
    score: input.score,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/session/${booking.id}/breakdown`)
  revalidatePath(`/mentor/session/${booking.id}/breakdown`)
  revalidatePath('/dashboard')

  return { ok: true }
}
