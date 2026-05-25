/**
 * Canonical session-slot grid for V0.
 *
 * Every week has the same set of session times anchored in US Eastern time.
 * Mentors and students each opt into a subset of these slots; bookings are
 * always placed into one of these canonical slots. There is no freeform
 * availability and no calendar OAuth in V0 - that's V0.5+.
 *
 * Day of week follows JS Date convention: 0 = Sunday ... 6 = Saturday.
 * Slot index is 0-3 for both weekdays and weekends (4 slots/day).
 */

export const ET = 'America/New_York'

/** Local-Eastern start hours for weekdays (Mon-Fri). 24h. */
export const WEEKDAY_SLOT_HOURS = [12, 16, 18, 20] as const

/** Local-Eastern start hours for weekends (Sat-Sun). 24h. */
export const WEEKEND_SLOT_HOURS = [10, 13, 16, 19] as const

/** All slot indexes share this duration. PRD locks at 30 min for V0. */
export const SLOT_DURATION_MINUTES = 30

/** How far out (in days) a student can book. */
export const BOOKING_HORIZON_DAYS = 28

/** Cancellation refund cutoff. */
export const CANCEL_REFUND_HOURS = 24

export type SlotKey = { day: number; slot: number }

export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6
}

/** Returns the start hours array (in ET) for the given day of week. */
export function slotHoursForDay(dayOfWeek: number): readonly number[] {
  return isWeekend(dayOfWeek) ? WEEKEND_SLOT_HOURS : WEEKDAY_SLOT_HOURS
}

/** Returns the ET start hour for a given slot key. Returns undefined if invalid. */
export function slotHour(key: SlotKey): number | undefined {
  return slotHoursForDay(key.day)[key.slot]
}

/** Stable string id for a slot, useful as a React key or jsonb member. */
export function slotKeyId(key: SlotKey): string {
  return `${key.day}-${key.slot}`
}

/** Parse the inverse of slotKeyId. Returns null if malformed. */
export function parseSlotKeyId(id: string): SlotKey | null {
  const [d, s] = id.split('-').map(Number)
  if (!Number.isInteger(d) || !Number.isInteger(s)) return null
  if (d < 0 || d > 6) return null
  if (s < 0 || s >= slotHoursForDay(d).length) return null
  return { day: d, slot: s }
}

/**
 * The full canonical week as an ordered list of SlotKeys.
 * Rendered as Sun -> Sat to match Date.getDay() ordering.
 */
export const ALL_CANONICAL_SLOTS: SlotKey[] = (() => {
  const out: SlotKey[] = []
  for (let day = 0; day <= 6; day++) {
    const hours = slotHoursForDay(day)
    for (let slot = 0; slot < hours.length; slot++) {
      out.push({ day, slot })
    }
  }
  return out
})()

/** Days in display order, Monday-first. */
export const WEEK_DAYS_DISPLAY = [
  { dayOfWeek: 1, label: 'Mon', long: 'Monday' },
  { dayOfWeek: 2, label: 'Tue', long: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wed', long: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thu', long: 'Thursday' },
  { dayOfWeek: 5, label: 'Fri', long: 'Friday' },
  { dayOfWeek: 6, label: 'Sat', long: 'Saturday' },
  { dayOfWeek: 0, label: 'Sun', long: 'Sunday' },
] as const

/** Pretty ET label for a slot, e.g. "4:00 PM ET". */
export function formatSlotLabelET(key: SlotKey): string {
  const h = slotHour(key)
  if (h === undefined) return ''
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:00 ${period} ET`
}
