/**
 * Slot math for the canonical weekly grid.
 *
 * All exports are pure functions. Real DB writes / mutations live in
 * `app/(dashboard)/dashboard/book/actions.ts` and friends.
 */

import { addDays, startOfDay } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

import {
  ALL_CANONICAL_SLOTS,
  BOOKING_HORIZON_DAYS,
  ET,
  type SlotKey,
  parseSlotKeyId,
  slotHour,
  slotHoursForDay,
  slotKeyId,
} from './canonical-slots'

export type SlotOptIn = SlotKey

export type OpenSlot = {
  /** UTC instant when the session starts. */
  startsAt: Date
  /** Day of week 0-6 (matches startsAt's ET local day). */
  day: number
  /** Slot index within that day. */
  slot: number
}

/**
 * Given a calendar date in ET (any timezone source), produce the UTC instant
 * for the slot's canonical start hour on that ET-local day.
 *
 * We treat the user's calendar date as the ET calendar date, then convert
 * ET local time to UTC. This ensures DST transitions are handled correctly.
 */
export function slotStartUtc(etCalendarDate: Date, slotIdx: number): Date | null {
  const dayOfWeek = Number(formatInTimeZone(etCalendarDate, ET, 'i')) % 7
  const hour = slotHoursForDay(dayOfWeek)[slotIdx]
  if (hour === undefined) return null

  const isoDay = formatInTimeZone(etCalendarDate, ET, 'yyyy-MM-dd')
  const hh = String(hour).padStart(2, '0')
  return fromZonedTime(`${isoDay}T${hh}:00:00`, ET)
}

/**
 * Normalize an availability_slots jsonb value (string ids OR object form)
 * into a Set of canonical slot ids. Tolerates both shapes so older rows that
 * predate this migration don't blow up.
 */
export function normalizeOptIns(
  raw: unknown
): Set<string> {
  const ids = new Set<string>()
  if (!Array.isArray(raw)) return ids
  for (const entry of raw) {
    if (typeof entry === 'string') {
      const parsed = parseSlotKeyId(entry)
      if (parsed) ids.add(slotKeyId(parsed))
    } else if (
      entry &&
      typeof entry === 'object' &&
      'day' in entry &&
      'slot' in entry
    ) {
      const day = Number((entry as { day: unknown }).day)
      const slot = Number((entry as { slot: unknown }).slot)
      if (
        Number.isInteger(day) &&
        Number.isInteger(slot) &&
        slotHoursForDay(day)[slot] !== undefined
      ) {
        ids.add(slotKeyId({ day, slot }))
      }
    }
  }
  return ids
}

/** Convert a Set of slot ids back into the wire shape we store in jsonb. */
export function serializeOptIns(ids: Iterable<string>): string[] {
  return Array.from(ids)
    .map(parseSlotKeyId)
    .filter((k): k is SlotKey => k !== null)
    .sort((a, b) => a.day - b.day || a.slot - b.slot)
    .map(slotKeyId)
}

/**
 * Compute open slots for the next `horizonDays` calendar days, starting
 * `from` (defaults to "now"). Open = both parties opted in AND not already
 * booked in `existingBookings`.
 *
 * `existingBookings` is the list of session_bookings rows we want to subtract.
 * Pass them with status='upcoming' filtered upstream.
 */
export function getOpenSlots(params: {
  mentorOptIns: Set<string>
  studentOptIns: Set<string>
  existingBookings: { startsAt: Date }[]
  from?: Date
  horizonDays?: number
}): OpenSlot[] {
  const {
    mentorOptIns,
    studentOptIns,
    existingBookings,
    from = new Date(),
    horizonDays = BOOKING_HORIZON_DAYS,
  } = params

  const now = from
  const intersect = new Set<string>()
  for (const id of mentorOptIns) if (studentOptIns.has(id)) intersect.add(id)

  if (intersect.size === 0) return []

  const bookedKey = (d: Date) => d.toISOString()
  const taken = new Set(existingBookings.map((b) => bookedKey(b.startsAt)))

  const slots: OpenSlot[] = []
  for (let i = 0; i < horizonDays; i++) {
    const cursor = addDays(now, i)
    const dayOfWeek = Number(formatInTimeZone(cursor, ET, 'i')) % 7
    const hours = slotHoursForDay(dayOfWeek)
    for (let s = 0; s < hours.length; s++) {
      const id = slotKeyId({ day: dayOfWeek, slot: s })
      if (!intersect.has(id)) continue
      const startsAt = slotStartUtc(cursor, s)
      if (!startsAt) continue
      if (startsAt.getTime() <= now.getTime()) continue
      if (taken.has(bookedKey(startsAt))) continue
      slots.push({ startsAt, day: dayOfWeek, slot: s })
    }
  }
  return slots
}

/** Filter open slots to a single ISO-week (Mon-Sun) anchored on `weekStart`. */
export function filterToWeek(
  slots: OpenSlot[],
  weekStart: Date
): OpenSlot[] {
  const start = startOfDay(weekStart).getTime()
  const end = addDays(startOfDay(weekStart), 7).getTime()
  return slots.filter(
    (s) => s.startsAt.getTime() >= start && s.startsAt.getTime() < end
  )
}

/**
 * Pretty label for a slot's start, like:
 *   "Mon May 12, 4:00 PM ET (1:00 PM PT)"
 * If `viewerTz` matches ET (or is omitted), just shows the ET label.
 */
export function formatSlot(startsAt: Date, viewerTz?: string): string {
  const etLabel = formatInTimeZone(startsAt, ET, 'EEE MMM d, h:mm a')
  if (!viewerTz || viewerTz === ET) {
    return `${etLabel} ET`
  }
  const localLabel = formatInTimeZone(startsAt, viewerTz, 'h:mm a zzz')
  return `${etLabel} ET (${localLabel})`
}

/** Short label, e.g. "4:00 PM ET". */
export function formatSlotTimeOnly(startsAt: Date, viewerTz?: string): string {
  const etLabel = formatInTimeZone(startsAt, ET, 'h:mm a')
  if (!viewerTz || viewerTz === ET) return `${etLabel} ET`
  const localLabel = formatInTimeZone(startsAt, viewerTz, 'h:mm a zzz')
  return `${etLabel} ET / ${localLabel}`
}

/** Day label like "Mon May 12" in ET. */
export function formatDayHeaderET(startsAt: Date): string {
  return formatInTimeZone(startsAt, ET, 'EEE MMM d')
}

/** Group open slots by ET calendar date. Preserves array order. */
export function groupSlotsByDay(slots: OpenSlot[]): {
  dateLabel: string
  slots: OpenSlot[]
}[] {
  const groups = new Map<string, OpenSlot[]>()
  for (const s of slots) {
    const key = formatInTimeZone(s.startsAt, ET, 'yyyy-MM-dd')
    const arr = groups.get(key) ?? []
    arr.push(s)
    groups.set(key, arr)
  }
  return Array.from(groups.entries()).map(([key, arr]) => ({
    dateLabel: formatInTimeZone(new Date(`${key}T12:00:00Z`), ET, 'EEE MMM d'),
    slots: arr,
  }))
}

/**
 * Helper to confirm a (mentor, student, startsAt) tuple is a valid canonical
 * slot both parties opted into. Used by the server action before writing.
 */
export function validateBookingSlot(params: {
  mentorOptIns: Set<string>
  studentOptIns: Set<string>
  startsAt: Date
}): { valid: true; key: SlotKey } | { valid: false; reason: string } {
  const { mentorOptIns, studentOptIns, startsAt } = params
  const dayOfWeek = Number(formatInTimeZone(startsAt, ET, 'i')) % 7
  const hour = Number(formatInTimeZone(startsAt, ET, 'H'))
  const slotIdx = slotHoursForDay(dayOfWeek).indexOf(hour)
  if (slotIdx < 0) {
    return { valid: false, reason: 'Not a canonical slot time.' }
  }
  // Only accept slots that land exactly on the canonical hour (no off-grid bookings).
  if (
    Number(formatInTimeZone(startsAt, ET, 'm')) !== 0 ||
    Number(formatInTimeZone(startsAt, ET, 's')) !== 0
  ) {
    return { valid: false, reason: 'Slot must be on the canonical hour.' }
  }
  const id = slotKeyId({ day: dayOfWeek, slot: slotIdx })
  if (!mentorOptIns.has(id)) {
    return { valid: false, reason: 'Mentor is not available at that slot.' }
  }
  if (!studentOptIns.has(id)) {
    return { valid: false, reason: 'You have not opted into that slot.' }
  }
  return { valid: true, key: { day: dayOfWeek, slot: slotIdx } }
}

/** Re-exports so callers don't have to dig into canonical-slots. */
export {
  ALL_CANONICAL_SLOTS,
  BOOKING_HORIZON_DAYS,
  ET,
  parseSlotKeyId,
  slotHour,
  slotKeyId,
}
export type { SlotKey }
