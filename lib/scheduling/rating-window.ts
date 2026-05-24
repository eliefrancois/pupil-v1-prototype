/**
 * Rating window: after a session ends, the student has this many hours to
 * submit a rating. Once submitted, the rating is locked (can't be changed).
 * After the window closes, the student can no longer submit a rating.
 *
 * Kept in shared util so the server action and the client card agree on the
 * cutoff, and so admin tooling can reuse the same logic.
 */
export const RATING_WINDOW_HOURS = 24

export interface RatingWindow {
  /** When the rating window closes (ISO instant). */
  closesAt: Date
  /** True iff `now < closesAt`. */
  isOpen: boolean
  /** Hours remaining (rounded down). Zero if closed. */
  hoursLeft: number
}

/**
 * Compute the rating window for a session.
 *
 * Prefers the real `ended_at` (from Daily's meeting.ended webhook). Falls
 * back to scheduled `starts_at + duration` if the webhook hasn't landed
 * yet — this keeps the window deterministic even if Daily is slow.
 */
export function computeRatingWindow(
  booking: {
    starts_at: string
    duration: number | null
    ended_at?: string | null
  },
  now: Date = new Date()
): RatingWindow {
  const endRef = booking.ended_at
    ? new Date(booking.ended_at)
    : new Date(
        new Date(booking.starts_at).getTime() +
          (booking.duration ?? 30) * 60 * 1000
      )

  const closesAt = new Date(
    endRef.getTime() + RATING_WINDOW_HOURS * 60 * 60 * 1000
  )

  const msLeft = closesAt.getTime() - now.getTime()
  const isOpen = msLeft > 0
  const hoursLeft = isOpen ? Math.floor(msLeft / (60 * 60 * 1000)) : 0

  return { closesAt, isOpen, hoursLeft }
}
