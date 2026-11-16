#!/usr/bin/env -S npx tsx
/**
 * Prints the plain-text version of every reminder (each reminder, round, and
 * step) plus the weekly digest, using sample names. Sends nothing.
 *
 * Usage:
 *   npx tsx scripts/preview-reminders.ts
 */

import { render } from '@react-email/render'

import ReminderDigestEmail from '../emails/reminder-digest'
import { renderReminderText } from '../lib/email/notifications'
import { reminderCopy } from '../lib/reminders/copy'
import { REMINDERS } from '../lib/reminders/definitions'
import { sampleReminders } from '../lib/reminders/samples'

async function main() {
  const site = 'https://www.getpupil.com'
  for (const sample of sampleReminders({ allRounds: true, allSteps: true })) {
    const def = REMINDERS[sample.key]
    const ctx =
      sample.key === 'student_say_hi' && sample.round === 1 && sample.step === 0
        ? { ...sample.ctx, ccParent: true }
        : sample.ctx
    const copy = reminderCopy(sample.key, sample.round, sample.step, ctx)
    const text = await renderReminderText({
      ...copy,
      ctaLabel: def.cta,
      ctaUrl: `${site}/l/<token>`,
      unsubscribeUrl: `${site}/unsubscribe?token=<token>`,
    })
    console.log(
      `\n===== ${sample.key} | round ${sample.round} | email ${sample.step + 1} of ${def.cadence.length} =====`
    )
    console.log(`Subject: ${copy.subject}\n`)
    console.log(text)
  }

  console.log('\n===== weekly digest (sample data) =====')
  console.log(await render(ReminderDigestEmail({
    stuckMentors: [{ name: 'Jordan Park', waiting: 2, daysSinceApproval: 12 }],
    silentStudents: [{ name: 'Alex R.', mentorName: 'Jordan Park', daysMatched: 9 }],
    rematchStudents: [{ name: 'Sam T.', mentorName: 'Riley Chen', daysFlagged: 2 }],
    sends: [
      { label: 'Student: say hi to your mentor', sent: 6, converted: 2 },
      { label: 'Mentor: set availability', sent: 4, converted: 1 },
    ],
    totals: { sent: 10, converted: 3, failed: 0 },
  }), { plainText: true }))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
