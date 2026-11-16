import type { SupabaseClient } from '@supabase/supabase-js'

import { REMINDER_KEYS, isReminderKey, type ReminderKey } from './definitions'
import { DEFAULT_TIME_ZONE, localDate } from './time'

export interface ReminderSetting {
  key: ReminderKey
  enabled: boolean
  liveSince: string | null
}

export type ReminderMode = 'live' | 'dry_run'

export function remindersGloballyEnabled(): boolean {
  return process.env.REMINDERS_ENABLED === 'true'
}

export async function loadReminderSettings(
  supabase: SupabaseClient
): Promise<Map<ReminderKey, ReminderSetting>> {
  const { data, error } = await supabase
    .from('email_reminder_settings')
    .select('reminder_key, enabled, live_since')
    .returns<{ reminder_key: string; enabled: boolean; live_since: string | null }[]>()
  if (error) throw new Error(error.message)

  const settings = new Map<ReminderKey, ReminderSetting>(
    REMINDER_KEYS.map((key) => [key, { key, enabled: false, liveSince: null }])
  )
  for (const row of data ?? []) {
    if (!isReminderKey(row.reminder_key)) continue
    settings.set(row.reminder_key, {
      key: row.reminder_key,
      enabled: row.enabled,
      liveSince: row.live_since,
    })
  }
  return settings
}

/**
 * Live only when the global env switch and the admin toggle are both on, and
 * the reminder was turned on before today (ET). The first day is a dry run so
 * admins can check who would be emailed.
 */
export function reminderMode(setting: ReminderSetting | undefined, now: Date): ReminderMode {
  if (!remindersGloballyEnabled() || !setting?.enabled || !setting.liveSince) return 'dry_run'
  return localDate(setting.liveSince, DEFAULT_TIME_ZONE) < localDate(now, DEFAULT_TIME_ZONE)
    ? 'live'
    : 'dry_run'
}
