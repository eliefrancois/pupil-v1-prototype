'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  createMeetingToken,
  createOrGetRoom,
  roomNameForBooking,
} from '@/lib/daily/client'
import {
  computeJoinWindow,
  joinWindowAsUnixSeconds,
} from '@/lib/scheduling/join-window'

export type JoinSessionResult =
  | {
      ok: true
      roomUrl: string
      token: string
      isMentor: boolean
    }
  | {
      ok: false
      error: string
      code?:
        | 'not_authenticated'
        | 'not_found'
        | 'not_authorized'
        | 'cancelled'
        | 'too_early'
        | 'too_late'
        | 'daily_failed'
    }

/**
 * Returns a Daily.co room URL + a freshly-minted meeting token for the
 * current user. Lazily creates the room on first call.
 *
 * Enforces:
 * - Caller must be the mentor or student on the booking.
 * - Booking status must be 'upcoming'.
 * - Current time must be inside the join window.
 */
export async function joinSession(
  bookingId: string
): Promise<JoinSessionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Not signed in.', code: 'not_authenticated' }
  }

  const { data: booking } = await supabase
    .from('session_bookings')
    .select(
      'id, mentor_id, student_id, starts_at, duration, status, daily_room_url'
    )
    .eq('id', bookingId)
    .maybeSingle<{
      id: string
      mentor_id: string
      student_id: string
      starts_at: string
      duration: number | null
      status: string
      daily_room_url: string | null
    }>()

  if (!booking) {
    return { ok: false, error: 'Session not found.', code: 'not_found' }
  }
  if (booking.mentor_id !== user.id && booking.student_id !== user.id) {
    return { ok: false, error: 'Not authorized.', code: 'not_authorized' }
  }
  if (booking.status !== 'upcoming') {
    return {
      ok: false,
      error: `This session is ${booking.status}.`,
      code: 'cancelled',
    }
  }

  const startsAt = new Date(booking.starts_at)
  const duration = booking.duration ?? 30
  const window = computeJoinWindow(startsAt, duration)
  if (!window.isOpen) {
    if (window.secondsUntilOpen > 0) {
      return {
        ok: false,
        error: `You can join 5 minutes before the session starts.`,
        code: 'too_early',
      }
    }
    return {
      ok: false,
      error: `This session has ended and the join window is closed.`,
      code: 'too_late',
    }
  }

  const isMentor = booking.mentor_id === user.id
  const roomName = roomNameForBooking(booking.id)
  const { nbf, exp } = joinWindowAsUnixSeconds(startsAt, duration)

  // Always call createOrGetRoom, even if booking.daily_room_url is set. Daily
  // auto-deletes rooms after their exp passes, so a cached URL on the booking
  // can point at a room that no longer exists upstream (would surface as
  // "meeting does not exist" in the iframe). createOrGetRoom is idempotent: if
  // the room still exists, Daily returns 400 "already exists" and we re-fetch;
  // if it was cleaned up, we get a fresh one with the current nbf/exp.
  let roomUrl: string | null = null
  try {
    const room = await createOrGetRoom({
      name: roomName,
      notBefore: nbf,
      expires: exp,
      autoRecord: true,
      autoTranscribe: true,
    })
    roomUrl = room.url

    if (booking.daily_room_url !== room.url) {
      await supabase
        .from('session_bookings')
        .update({
          daily_room_name: room.name,
          daily_room_url: room.url,
        })
        .eq('id', booking.id)
    }
  } catch (err) {
    console.error('[joinSession] createOrGetRoom failed', err)
    return {
      ok: false,
      error: 'We could not create the call room. Please try again in a moment.',
      code: 'daily_failed',
    }
  }

  // Look up the user's display name for the meeting token (shown in the call).
  const { data: userRow } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle<{ full_name: string | null }>()
  const userName = userRow?.full_name?.trim() || (isMentor ? 'Mentor' : 'Student')

  let token: string
  try {
    const result = await createMeetingToken({
      roomName,
      userId: user.id,
      userName,
      isMentor,
      notBefore: nbf,
      expires: exp,
    })
    token = result.token
  } catch (err) {
    console.error('[joinSession] createMeetingToken failed', err)
    return {
      ok: false,
      error: 'We could not authenticate you to the call.',
      code: 'daily_failed',
    }
  }

  if (!roomUrl) {
    return {
      ok: false,
      error: 'Room URL missing. Try again.',
      code: 'daily_failed',
    }
  }

  revalidatePath(`/dashboard/session/${booking.id}`)
  revalidatePath(`/mentor/session/${booking.id}`)

  return {
    ok: true,
    roomUrl,
    token,
    isMentor,
  }
}
