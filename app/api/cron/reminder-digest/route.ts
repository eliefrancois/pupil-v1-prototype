import { NextResponse, type NextRequest } from 'next/server'

import { notifyReminderDigest } from '@/lib/email/notifications'
import { buildReminderDigest } from '@/lib/reminders/digest'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Monday digest for Dario (see vercel.json). Sends only when
 * REMINDER_DIGEST_ENABLED=true; otherwise returns the counts it would send.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set.' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const digest = await buildReminderDigest(createServiceClient())
    const live = process.env.REMINDER_DIGEST_ENABLED === 'true'
    const sent = live ? await notifyReminderDigest(digest) : false
    const summary = {
      mode: live ? 'live' : 'dry_run',
      sent,
      stuckMentors: digest.stuckMentors.length,
      silentStudents: digest.silentStudents.length,
      rematchStudents: digest.rematchStudents.length,
      remindersSent: digest.totals.sent,
      remindersConverted: digest.totals.converted,
    }
    console.log('[reminder-digest]', JSON.stringify(summary))
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[reminder-digest] failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
