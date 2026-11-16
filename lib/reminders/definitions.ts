export const REMINDER_KEYS = [
  'mentor_matched_no_availability',
  'mentor_set_availability',
  'mentor_finish_profile',
  'student_say_hi',
  'student_book_first_session',
  'student_finish_onboarding',
] as const

export type ReminderKey = (typeof REMINDER_KEYS)[number]
export type ReminderAudience = 'mentor' | 'student'

export interface ReminderDefinition {
  key: ReminderKey
  label: string
  description: string
  audience: ReminderAudience
  /** Days after the anchor event for each email in a round. */
  cadence: number[]
  /** Lower sends first when several reminders are due the same day. */
  priority: number
  targetPath: string
  cta: string
}

export const MAX_ROUNDS = 3
export const DAYS_BETWEEN_ROUNDS = 30
/** A send converts when the user does the thing within this many days. */
export const CONVERSION_WINDOW_DAYS = 3
/** Days after a round ends without availability before students get flagged. */
export const REMATCH_GRACE_DAYS = 3

export const LOGIN_LINK_DAYS: Record<ReminderAudience, number> = {
  mentor: 14,
  student: 7,
}

/** Local send hour by audience (24h clock). */
export const SEND_HOUR: Record<ReminderAudience, number> = {
  student: 16,
  mentor: 18,
}
/** Hourly runs stop sending after this local hour so nobody gets a late-night email. */
export const QUIET_HOUR = 21

export const REMINDERS: Record<ReminderKey, ReminderDefinition> = {
  mentor_matched_no_availability: {
    key: 'mentor_matched_no_availability',
    label: 'Mentor: matched students can\u2019t book',
    description:
      'Approved mentor with matched students and no weekly availability. First email goes out on the next run.',
    audience: 'mentor',
    cadence: [0, 3, 7],
    priority: 1,
    targetPath: '/mentor/schedule',
    cta: 'Add your times',
  },
  mentor_set_availability: {
    key: 'mentor_set_availability',
    label: 'Mentor: set availability',
    description:
      'Approved, claimed mentor with no availability and no students yet. Days 2, 7, 14 after approval.',
    audience: 'mentor',
    cadence: [2, 7, 14],
    priority: 2,
    targetPath: '/mentor/schedule',
    cta: 'Set your availability',
  },
  mentor_finish_profile: {
    key: 'mentor_finish_profile',
    label: 'Mentor: finish profile',
    description:
      'Mentor account that never submitted the mentor application. Days 1, 4, 10 after signup.',
    audience: 'mentor',
    cadence: [1, 4, 10],
    priority: 3,
    targetPath: '/mentor-onboarding',
    cta: 'Finish your profile',
  },
  student_say_hi: {
    key: 'student_say_hi',
    label: 'Student: say hi to your mentor',
    description: 'Matched student who hasn\u2019t sent a message. Days 3 and 7 after the match.',
    audience: 'student',
    cadence: [3, 7],
    priority: 1,
    targetPath: '/dashboard/messages',
    cta: 'Send a message',
  },
  student_book_first_session: {
    key: 'student_book_first_session',
    label: 'Student: book a first session',
    description:
      'Student who messaged their mentor but hasn\u2019t booked. Day 7 after the first message.',
    audience: 'student',
    cadence: [7],
    priority: 2,
    targetPath: '/dashboard/book',
    cta: 'Book a session',
  },
  student_finish_onboarding: {
    key: 'student_finish_onboarding',
    label: 'Student: finish onboarding',
    description: 'Student who signed up but didn\u2019t finish onboarding. Days 1 and 4 after signup.',
    audience: 'student',
    cadence: [1, 4],
    priority: 3,
    targetPath: '/onboarding',
    cta: 'Finish signing up',
  },
}

export function isReminderKey(value: string): value is ReminderKey {
  return (REMINDER_KEYS as readonly string[]).includes(value)
}
