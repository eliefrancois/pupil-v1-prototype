import { NextResponse, type NextRequest } from 'next/server'

import { runReminders } from '@/lib/reminders/run'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEFAULT_RUN_LIMIT = 150

/**
 * Lifecycle reminder run, triggered by Vercel Cron (see vercel.json).
 * Nothing sends unless REMINDERS_ENABLED=true and the reminder is switched on
 * in /admin/reminders; otherwise the run records who would be emailed.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set.' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedLimit = Number(process.env.REMINDERS_RUN_LIMIT)
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_RUN_LIMIT

  const supabase = createServiceClient()

  // Access checks already compare dates; this keeps subscription_status in step.
  const { data: expired, error: expireError } = await supabase.rpc('expire_prepaid_access')
  if (expireError) {
    console.error('[billing] expire_prepaid_access failed:', expireError.message)
  } else if (expired) {
    console.log(`[billing] prepaid access ended for ${expired} user(s)`)
  }

  try {
    const result = await runReminders(supabase, { limit })
    console.log(
      `[reminders] ${result.globalMode}/${result.schedule}: sent=${result.sent} failed=${result.failed} outside_window=${result.outsideWindow} dry_run_logged=${result.dryRunLogged} converted=${result.housekeeping.converted} flagged=${result.housekeeping.flagged}`
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[reminders] run failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
