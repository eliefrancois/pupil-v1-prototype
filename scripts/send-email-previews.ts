#!/usr/bin/env -S npx tsx
/**
 * Send preview copies of every Pupil transactional email to a review inbox.
 *
 * Usage:
 *   npx tsx scripts/send-email-previews.ts
 *   npx tsx scripts/send-email-previews.ts --to someone@example.com
 */

import fs from 'node:fs'
import path from 'node:path'
import { render } from '@react-email/render'

import MentorClaimEmail from '../emails/mentor-claim'
import MentorApprovedEmail from '../emails/mentor-approved'
import MentorAssignedEmail from '../emails/mentor-assigned'
import StudentMatchedEmail from '../emails/student-matched'
import MatchRequestForwardedEmail from '../emails/match-request-forwarded'
import MatchRequestDeclinedEmail from '../emails/match-request-declined'
import MatchRequestAdminEmail from '../emails/match-request-admin'

loadEnvLocal()

const REVIEW_TO = process.argv.includes('--to')
  ? process.argv[process.argv.indexOf('--to') + 1]
  : 'eliefrancois22@gmail.com'

const REVIEW_NAME = 'Elie Francois'
const FROM = process.env.RESEND_FROM ?? 'Pupil <hello@getpupil.com>'
const API_KEY = process.env.RESEND_API_KEY

async function main() {
  if (!API_KEY) {
    console.error('Missing RESEND_API_KEY. Add it to .env.local first.')
    process.exit(1)
  }

  const samples = [
    {
      id: 'mentor-approved',
      subject: '[Pupil preview] Mentor approved',
      node: MentorApprovedEmail({
        mentorName: REVIEW_NAME,
        mentorUserId: '9faea745-98e5-43f3-9892-7ae526734b07',
        university: 'New York University',
      }),
    },
    {
      id: 'mentor-claim-with-student',
      subject: '[Pupil preview] Ghost mentor claim (student requested)',
      node: MentorClaimEmail({
        mentorName: REVIEW_NAME,
        claimUrl: 'https://www.getpupil.com/mentor-claim/preview-token',
        requestingStudentName: 'Danaya Student',
      }),
    },
    {
      id: 'mentor-claim',
      subject: '[Pupil preview] Ghost mentor claim',
      node: MentorClaimEmail({
        mentorName: REVIEW_NAME,
        claimUrl: 'https://www.getpupil.com/mentor-claim/preview-token',
      }),
    },
    {
      id: 'student-matched',
      subject: '[Pupil preview] Student matched',
      node: StudentMatchedEmail({
        studentName: REVIEW_NAME,
        mentorName: 'Dario Anaya',
        mentorUniversity: 'New York University',
      }),
    },
    {
      id: 'mentor-assigned',
      subject: '[Pupil preview] Mentor assigned mentee',
      node: MentorAssignedEmail({
        mentorName: REVIEW_NAME,
        studentName: 'Danaya Student',
        studentGrade: 12,
      }),
    },
    {
      id: 'match-request-admin',
      subject: '[Pupil preview] Admin match request alert',
      node: MatchRequestAdminEmail({
        studentName: 'Danaya Student',
        studentEmail: 'danaya.student@andreanhs.com',
        studentGrade: 12,
        mentorName: REVIEW_NAME,
        mentorIsGhost: false,
        message: 'I want help with NYU applications and essay strategy.',
        requestId: 'preview-request-id',
      }),
    },
    {
      id: 'match-request-forwarded',
      subject: '[Pupil preview] Match request forwarded to mentor',
      node: MatchRequestForwardedEmail({
        mentorName: REVIEW_NAME,
        studentName: 'Danaya Student',
        studentMessage:
          'I want help with NYU applications and would love to talk through essays.',
      }),
    },
    {
      id: 'match-request-declined',
      subject: '[Pupil preview] Match request declined',
      node: MatchRequestDeclinedEmail({
        studentName: REVIEW_NAME,
        mentorName: 'Jordan Park',
        reason: 'This mentor is not taking new mentees this semester.',
      }),
    },
  ]

  console.log(`Sending ${samples.length} preview emails to ${REVIEW_TO}...`)

  for (const sample of samples) {
    const html = await render(sample.node)
    const text = await render(sample.node, { plainText: true })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: REVIEW_TO,
        subject: sample.subject,
        html,
        text,
        tags: [{ name: 'category', value: `preview_${sample.id}` }],
      }),
    })

    const body = await res.text()
    if (!res.ok) {
      console.error(`FAILED ${sample.id}: HTTP ${res.status}`)
      console.error(body)
      process.exit(1)
    }

    console.log(`✓ ${sample.id}`)
    await sleep(600)
  }

  console.log(`\nDone. Check ${REVIEW_TO} for ${samples.length} preview emails.`)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
