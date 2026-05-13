/**
 * Time-window logic for when a session is joinable.
 *
 * A session is joinable from JOIN_WINDOW_OPENS_MIN_BEFORE_START minutes
 * before scheduled start, until JOIN_WINDOW_CLOSES_MIN_AFTER_END minutes
 * after scheduled end.
 */

import { SLOT_DURATION_MINUTES } from './canonical-slots'

export const JOIN_WINDOW_OPENS_MIN_BEFORE_START = 5
export const JOIN_WINDOW_CLOSES_MIN_AFTER_END = 30

/** Mentor no-show threshold: minutes after scheduled start. */
export const MENTOR_NO_SHOW_THRESHOLD_MIN = 15

export type JoinWindow = {
  opensAt: Date
  closesAt: Date
  /** Whether `now` is within the join window. */
  isOpen: boolean
  /** Seconds until window opens (negative if already open). */
  secondsUntilOpen: number
  /** Seconds until window closes (negative if already closed). */
  secondsUntilClose: number
}

export function computeJoinWindow(
  startsAt: Date,
  durationMinutes: number = SLOT_DURATION_MINUTES,
  now: Date = new Date()
): JoinWindow {
  const startsMs = startsAt.getTime()
  const endsMs = startsMs + durationMinutes * 60_000
  const opensMs = startsMs - JOIN_WINDOW_OPENS_MIN_BEFORE_START * 60_000
  const closesMs = endsMs + JOIN_WINDOW_CLOSES_MIN_AFTER_END * 60_000
  const nowMs = now.getTime()

  return {
    opensAt: new Date(opensMs),
    closesAt: new Date(closesMs),
    isOpen: nowMs >= opensMs && nowMs <= closesMs,
    secondsUntilOpen: Math.floor((opensMs - nowMs) / 1000),
    secondsUntilClose: Math.floor((closesMs - nowMs) / 1000),
  }
}

/** UNIX seconds for Daily.co token nbf/exp claims. */
export function joinWindowAsUnixSeconds(
  startsAt: Date,
  durationMinutes: number = SLOT_DURATION_MINUTES
): { nbf: number; exp: number } {
  const w = computeJoinWindow(startsAt, durationMinutes)
  return {
    nbf: Math.floor(w.opensAt.getTime() / 1000),
    exp: Math.floor(w.closesAt.getTime() / 1000),
  }
}
