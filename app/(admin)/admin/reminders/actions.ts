'use server'

import { revalidatePath } from 'next/cache'

import { notifyReminder } from '@/lib/email/notifications'
import { getUnsubscribeToken, unsubscribeUrls } from '@/lib/email/preferences'
import { reminderCopy } from '@/lib/reminders/copy'
import { REMINDERS, isReminderKey } from '@/lib/reminders/definitions'
import { sampleReminders } from '@/lib/reminders/samples'
import { getSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Result = { ok: true; message?: string } | { ok: false; error: string }

const SEND_SPACING_MS = 600

async function ensureAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle<{ role: string; email: string }>()
  if (!data || data.role !== 'admin') {
    return { ok: false as const, error: 'Admins only.' }
  }
  return { ok: true as const, adminId: user.id, email: data.email }
}

/** Turning a reminder on starts its dry-run day; sends begin the next ET day. */
export async function setReminderEnabled(key: string, enabled: boolean): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  if (!isReminderKey(key)) return { ok: false, error: 'Unknown reminder.' }

  const now = new Date().toISOString()
  const { error } = await createServiceClient()
    .from('email_reminder_settings')
    .upsert(
      {
        reminder_key: key,
        enabled,
        live_since: enabled ? now : null,
        updated_at: now,
        updated_by: auth.adminId,
      },
      { onConflict: 'reminder_key' }
    )
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/reminders')
  return { ok: true }
}

/** Sends every reminder template with sample data to the signed-in admin. */
export async function sendSampleReminders(allRounds: boolean): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const service = createServiceClient()
  const urls = unsubscribeUrls(await getUnsubscribeToken(service, auth.adminId))
  const site = getSiteUrl()

  let sent = 0
  let failed = 0
  for (const sample of sampleReminders({ allRounds })) {
    const def = REMINDERS[sample.key]
    const copy = reminderCopy(sample.key, sample.round, sample.step, sample.ctx)
    const result = await notifyReminder({
      to: auth.email,
      tag: `reminder_sample_${sample.key}`,
      ...copy,
      subject: `[Sample, round ${sample.round}] ${copy.subject}`,
      ctaLabel: def.cta,
      ctaUrl: `${site}${def.targetPath}`,
      unsubscribeUrl: urls.page,
      oneClickUnsubscribeUrl: urls.oneClick,
    })
    if (result.ok) sent++
    else failed++
    await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS))
  }

  return failed === 0
    ? { ok: true, message: `Sent ${sent} sample emails to ${auth.email}.` }
    : { ok: false, error: `Sent ${sent}, ${failed} failed. Check the server logs.` }
}
