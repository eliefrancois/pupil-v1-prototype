import { fromZonedTime } from 'date-fns-tz'

import {
  DAYS_BETWEEN_ROUNDS,
  MAX_ROUNDS,
  type ReminderDefinition,
  type ReminderKey,
} from './definitions'
import { addDays, localDate } from './time'

export interface ReminderState {
  user_id: string
  reminder_key: ReminderKey
  anchor_at: string
  round: number
  step: number
  round_started_at: string
  last_sent_at: string | null
  next_due_at: string | null
  completed_at: string | null
  stopped_reason: string | null
  converted_at: string | null
}

export type NextStep =
  | {
      kind: 'due'
      round: number
      /** Index into the cadence; also the number of emails already sent this round. */
      step: number
      /** Local calendar date the email becomes due. */
      dueDate: string
      roundStartedAt: string
    }
  | { kind: 'finished' }

function laterDate(a: string, b: string): string {
  return a > b ? a : b
}

/** Noon local on a calendar date, so later date math can't slip across midnight. */
function noonOn(date: string, zone: string): string {
  return fromZonedTime(`${date}T12:00:00`, zone).toISOString()
}

/**
 * The next email in a reminder's loop. Each round sends the cadence, pauses
 * DAYS_BETWEEN_ROUNDS after the round's last email, then repeats, up to
 * MAX_ROUNDS. Steps keep their cadence spacing even when a run is missed, so
 * catching up never sends two steps on back-to-back days.
 */
export function nextStep(
  def: ReminderDefinition,
  state: ReminderState | null,
  anchorAt: string,
  zone: string
): NextStep {
  const cadence = def.cadence

  if (!state) {
    return {
      kind: 'due',
      round: 1,
      step: 0,
      dueDate: addDays(localDate(anchorAt, zone), cadence[0]),
      roundStartedAt: anchorAt,
    }
  }

  if (state.step < cadence.length) {
    const base = localDate(state.round_started_at, zone)
    let dueDate = addDays(base, cadence[state.step])
    if (state.last_sent_at && state.step > 0) {
      const gap = Math.max(1, cadence[state.step] - cadence[state.step - 1])
      dueDate = laterDate(dueDate, addDays(localDate(state.last_sent_at, zone), gap))
    }
    return {
      kind: 'due',
      round: state.round,
      step: state.step,
      dueDate,
      roundStartedAt: state.round_started_at,
    }
  }

  if (state.round >= MAX_ROUNDS || !state.last_sent_at) return { kind: 'finished' }

  const dueDate = addDays(localDate(state.last_sent_at, zone), DAYS_BETWEEN_ROUNDS)
  return {
    kind: 'due',
    round: state.round + 1,
    step: 0,
    dueDate,
    roundStartedAt: noonOn(addDays(dueDate, -cadence[0]), zone),
  }
}

/** State to store after sending `step` of `round`. */
export function stateAfterSend({
  def,
  userId,
  anchorAt,
  sent,
  sentAt,
  zone,
  sendHour,
}: {
  def: ReminderDefinition
  userId: string
  anchorAt: string
  sent: Extract<NextStep, { kind: 'due' }>
  sentAt: string
  zone: string
  sendHour: number
}): Omit<ReminderState, 'converted_at'> {
  const updated: Omit<ReminderState, 'converted_at'> = {
    user_id: userId,
    reminder_key: def.key,
    anchor_at: anchorAt,
    round: sent.round,
    step: sent.step + 1,
    round_started_at: sent.roundStartedAt,
    last_sent_at: sentAt,
    next_due_at: null,
    completed_at: null,
    stopped_reason: null,
  }
  const following = nextStep(def, { ...updated, converted_at: null }, anchorAt, zone)
  if (following.kind === 'finished') {
    updated.completed_at = sentAt
    updated.stopped_reason = 'max_rounds'
  } else {
    const hh = String(sendHour).padStart(2, '0')
    updated.next_due_at = fromZonedTime(`${following.dueDate}T${hh}:00:00`, zone).toISOString()
  }
  return updated
}

export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return new Date(a).getTime() === new Date(b).getTime()
}
