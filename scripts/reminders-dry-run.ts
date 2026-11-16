#!/usr/bin/env -S npx tsx
/**
 * Plans the reminder job against the real database without sending or
 * writing anything. Prints counts only (no names or emails).
 *
 * Usage:
 *   RESEND_API_KEY= npx tsx scripts/reminders-dry-run.ts [daysAhead...]
 *
 * Each daysAhead value simulates the plan that many days from now, so you
 * can see the cadence play out (e.g. `0 3 7`).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const text = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

async function main() {
  loadEnvLocal()
  process.env.RESEND_API_KEY = ''

  const { createServiceClient } = await import('../lib/supabase/service')
  const { planReminders } = await import('../lib/reminders/run')

  const offsets = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n))
  const supabase = createServiceClient()

  for (const daysAhead of offsets.length ? offsets : [0]) {
    const now = new Date(Date.now() + daysAhead * 86_400_000)
    const plan = await planReminders(supabase, { now, schedule: 'daily' })

    const byKey: Record<string, number> = {}
    const byStep: Record<string, number> = {}
    let withParentCc = 0
    for (const item of plan.wouldSend) {
      byKey[item.key] = (byKey[item.key] ?? 0) + 1
      const label = `${item.key} round ${item.next.round} step ${item.next.step + 1}`
      byStep[label] = (byStep[label] ?? 0) + 1
      if (item.recipient.parentEmails.length > 0) withParentCc++
    }

    console.log(`\n=== Plan for ${now.toISOString().slice(0, 10)} (today + ${daysAhead}d) ===`)
    console.log('Would send (one per person, highest priority):', byKey)
    console.log('By round/step:', byStep)
    console.log('With parent CC:', withParentCc)
    console.log('Live sends queued:', plan.toSend.length)
    console.log('People skipped entirely:', plan.skipped)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
