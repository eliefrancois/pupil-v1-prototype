import type { SupabaseClient } from '@supabase/supabase-js'

import {
  CONVERSION_WINDOW_DAYS,
  MAX_ROUNDS,
  REMINDER_KEYS,
  isReminderKey,
  type ReminderKey,
} from './definitions'

const DAY_MS = 24 * 60 * 60 * 1000

export interface ReminderStats {
  sent7: number
  /** Within the requested window (30 days by default). */
  sent: number
  failed: number
  /** Sends followed by the user doing the thing within CONVERSION_WINDOW_DAYS. */
  converted: number
  activeByRound: number[]
  finished: number
  convertedTotal: number
}

export interface ReminderStatsSummary {
  byReminder: Record<ReminderKey, ReminderStats>
  totals: { sent7: number; sent: number; converted: number; failed: number }
}

/** Sends (live, not dry runs) and conversions per reminder. */
export async function loadReminderStats(
  supabase: SupabaseClient,
  now = new Date(),
  sinceDays = 30
): Promise<ReminderStatsSummary> {
  const since = new Date(now.getTime() - sinceDays * DAY_MS).toISOString()
  const weekAgo = now.getTime() - 7 * DAY_MS

  const [logsRes, statesRes] = await Promise.all([
    supabase
      .from('email_reminder_log')
      .select('user_id, reminder_key, sent_at, ok')
      .eq('dry_run', false)
      .gte('sent_at', since)
      .returns<{ user_id: string; reminder_key: string; sent_at: string; ok: boolean | null }[]>(),
    supabase
      .from('email_reminder_state')
      .select('user_id, reminder_key, round, completed_at, stopped_reason, converted_at')
      .returns<
        {
          user_id: string
          reminder_key: string
          round: number
          completed_at: string | null
          stopped_reason: string | null
          converted_at: string | null
        }[]
      >(),
  ])
  if (logsRes.error) throw new Error(logsRes.error.message)
  if (statesRes.error) throw new Error(statesRes.error.message)

  const byReminder = Object.fromEntries(
    REMINDER_KEYS.map((key) => [
      key,
      {
        sent7: 0,
        sent: 0,
        failed: 0,
        converted: 0,
        activeByRound: Array.from({ length: MAX_ROUNDS }, () => 0),
        finished: 0,
        convertedTotal: 0,
      },
    ])
  ) as Record<ReminderKey, ReminderStats>

  const convertedAt = new Map<string, number>()
  for (const s of statesRes.data ?? []) {
    if (!isReminderKey(s.reminder_key)) continue
    const stats = byReminder[s.reminder_key]
    if (s.converted_at) {
      convertedAt.set(`${s.user_id}:${s.reminder_key}`, new Date(s.converted_at).getTime())
      stats.convertedTotal++
    } else if (s.completed_at) {
      stats.finished++
    } else {
      stats.activeByRound[Math.min(Math.max(s.round, 1), MAX_ROUNDS) - 1]++
    }
  }

  const totals = { sent7: 0, sent: 0, converted: 0, failed: 0 }
  for (const log of logsRes.data ?? []) {
    if (!isReminderKey(log.reminder_key)) continue
    const stats = byReminder[log.reminder_key]
    if (log.ok === false) {
      stats.failed++
      totals.failed++
      continue
    }
    if (log.ok !== true) continue
    const sentAt = new Date(log.sent_at).getTime()
    stats.sent++
    totals.sent++
    if (sentAt >= weekAgo) {
      stats.sent7++
      totals.sent7++
    }
    const doneAt = convertedAt.get(`${log.user_id}:${log.reminder_key}`)
    if (doneAt !== undefined && doneAt >= sentAt && doneAt <= sentAt + CONVERSION_WINDOW_DAYS * DAY_MS) {
      stats.converted++
      totals.converted++
    }
  }

  return { byReminder, totals }
}
