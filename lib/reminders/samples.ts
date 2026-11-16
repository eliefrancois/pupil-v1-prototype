import { MAX_ROUNDS, REMINDERS, REMINDER_KEYS, type ReminderKey } from './definitions'
import type { ReminderContext } from './facts'

export function sampleContext(key: ReminderKey): ReminderContext {
  if (REMINDERS[key].audience === 'mentor') {
    return {
      firstName: 'Jordan',
      mentorSchool: 'Georgetown University',
      studentFirstNames: key === 'mentor_matched_no_availability' ? ['Maya', 'Leo'] : undefined,
    }
  }
  return {
    firstName: 'Alex',
    mentorFirstName: 'Jordan',
    mentorSchool: 'Georgetown University',
    firstSessionFree: true,
  }
}

export interface SampleReminder {
  key: ReminderKey
  round: number
  step: number
  ctx: ReminderContext
}

/** Every template variant: each reminder, each round, and (optionally) each step. */
export function sampleReminders({
  allRounds,
  allSteps = false,
}: {
  allRounds: boolean
  allSteps?: boolean
}): SampleReminder[] {
  const samples: SampleReminder[] = []
  for (const key of REMINDER_KEYS) {
    const rounds = allRounds ? MAX_ROUNDS : 1
    const steps = allSteps ? REMINDERS[key].cadence.length : 1
    for (let round = 1; round <= rounds; round++) {
      for (let step = 0; step < steps; step++) {
        samples.push({ key, round, step, ctx: sampleContext(key) })
      }
    }
  }
  return samples
}
