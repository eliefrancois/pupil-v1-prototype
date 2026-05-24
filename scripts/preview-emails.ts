#!/usr/bin/env -S npx tsx
/**
 * Render each email template to HTML + plain-text so we can verify they
 * compile without running the full react-email dev server.
 *
 * Usage:
 *   npx tsx scripts/preview-emails.ts
 *
 * To preview visually:
 *   npm run email   # opens http://localhost:3010
 */

import { render } from '@react-email/render'

import MentorClaimEmail from '../emails/mentor-claim'
import MatchRequestForwardedEmail from '../emails/match-request-forwarded'
import MatchRequestDeclinedEmail from '../emails/match-request-declined'
import MatchRequestAdminEmail from '../emails/match-request-admin'

async function main() {
  const samples = [
    {
      name: 'mentor-claim (ghost, with requester)',
      node: MentorClaimEmail({
        mentorName: 'Sani Deshmukh',
        claimUrl: 'https://getpupil.com/mentor-claim/abc123',
        requestingStudentName: 'Alex Rivera',
      }),
    },
    {
      name: 'mentor-claim (no requester)',
      node: MentorClaimEmail({
        mentorName: 'Tamar Gordon',
        claimUrl: 'https://getpupil.com/mentor-claim/xyz789',
      }),
    },
    {
      name: 'match-request-forwarded',
      node: MatchRequestForwardedEmail({
        mentorName: 'Jordan Park',
        studentName: 'Alex Rivera',
        studentMessage:
          'I want to apply to Stanford and would love help with my essays.',
      }),
    },
    {
      name: 'match-request-declined',
      node: MatchRequestDeclinedEmail({
        studentName: 'Alex Rivera',
        mentorName: 'Jordan Park',
        reason: 'This mentor is not taking new mentees this semester.',
      }),
    },
    {
      name: 'match-request-admin (ghost)',
      node: MatchRequestAdminEmail({
        studentName: 'Alex Rivera',
        studentEmail: 'alex@example.com',
        studentGrade: 11,
        mentorName: 'Sani Deshmukh',
        mentorIsGhost: true,
        message: 'I want help with Stanford essays and CS programs.',
        requestId: 'req_abc123',
      }),
    },
  ]

  for (const s of samples) {
    const html = await render(s.node)
    const text = await render(s.node, { plainText: true })
    console.log(`\n========== ${s.name} ==========`)
    console.log(`html bytes: ${html.length}`)
    console.log(`text bytes: ${text.length}`)
    console.log(`---- plain text preview ----`)
    console.log(text.trim().slice(0, 600))
    console.log(text.trim().length > 600 ? '... (truncated)' : '')
  }
  console.log('\nAll templates rendered without errors.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
