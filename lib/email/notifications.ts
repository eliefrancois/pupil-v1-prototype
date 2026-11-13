/**
 * Email notification helpers.
 *
 * Each helper:
 *   1. Renders the matching React Email template to HTML + plain-text.
 *   2. Sends via Resend if RESEND_API_KEY is configured.
 *   3. Falls back to logging the payload so we can see exactly what would
 *      go out during local testing without a key.
 */

import { render } from '@react-email/render'

import MentorClaimEmail from '@/emails/mentor-claim'
import MentorClaimCampaignEmail, {
  claimCampaignSubject,
  type ClaimCampaignStep,
} from '@/emails/mentor-claim-campaign'
import MatchRequestForwardedEmail from '@/emails/match-request-forwarded'
import MatchRequestDeclinedEmail from '@/emails/match-request-declined'
import MatchRequestAdminEmail from '@/emails/match-request-admin'
import StudentMatchedEmail from '@/emails/student-matched'
import MentorAssignedEmail from '@/emails/mentor-assigned'
import MentorApprovedEmail from '@/emails/mentor-approved'

import { getSiteUrl } from '@/lib/site-url'

const SITE_URL = getSiteUrl()
const RESEND_KEY = process.env.RESEND_API_KEY
const ADMIN_EMAIL = 'dario@getpupil.com'

// ---------------------------------------------------------------------------
// Match request emails
// ---------------------------------------------------------------------------

export interface NewMatchRequestNotification {
  studentName: string
  studentEmail: string
  studentGrade: number | null
  mentorName: string
  mentorIsGhost: boolean
  message: string | null
  requestId: string
}

/** Sent to admin every time a student submits a match request. */
export async function notifyAdminOfMatchRequest(
  payload: NewMatchRequestNotification
) {
  const subject = payload.mentorIsGhost
    ? `[match] ${payload.studentName} requested a ghost mentor: ${payload.mentorName}`
    : `[match] ${payload.studentName} requested ${payload.mentorName}`

  const node = MatchRequestAdminEmail({
    studentName: payload.studentName,
    studentEmail: payload.studentEmail,
    studentGrade: payload.studentGrade,
    mentorName: payload.mentorName,
    mentorIsGhost: payload.mentorIsGhost,
    message: payload.message,
    requestId: payload.requestId,
  })

  await deliver({
    to: ADMIN_EMAIL,
    subject,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'match_request_admin',
  })
}

export interface RequestForwardedNotification {
  mentorEmail: string
  mentorName: string
  studentName: string
  studentMessage: string | null
}

/** Sent to a CLAIMED mentor when admin forwards a request to them. */
export async function notifyMentorOfForwardedRequest(
  payload: RequestForwardedNotification
) {
  const node = MatchRequestForwardedEmail({
    mentorName: payload.mentorName,
    studentName: payload.studentName,
    studentMessage: payload.studentMessage,
  })

  await deliver({
    to: payload.mentorEmail,
    subject: `${payload.studentName} wants to work with you on Pupil`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'match_request_mentor',
  })
}

export interface ClaimEmailNotification {
  mentorEmail: string
  mentorName: string
  claimUrl: string
  studentName: string | null
}

/**
 * Sent to a GHOST mentor when admin triggers the claim flow. If a student
 * specifically requested this mentor we include their name as context.
 */
export async function notifyGhostMentorToClaim(
  payload: ClaimEmailNotification
) {
  const node = MentorClaimEmail({
    mentorName: payload.mentorName,
    claimUrl: payload.claimUrl,
    requestingStudentName: payload.studentName,
    daysToExpiry: 30,
  })

  const subject = payload.studentName
    ? `${payload.studentName} wants you as their mentor on Pupil`
    : `Claim your Pupil mentor profile, ${firstName(payload.mentorName)}`

  await deliver({
    to: payload.mentorEmail,
    subject,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'mentor_claim',
  })
}

export interface ClaimCampaignNotification {
  step: ClaimCampaignStep
  mentorEmail: string
  mentorName: string
  claimUrl: string
  optOutUrl: string
  hideDate: string
}

/** One of the three scheduled claim reminders sent to imported mentors. */
export async function notifyGhostMentorClaimCampaign(
  payload: ClaimCampaignNotification
): Promise<boolean> {
  const node = MentorClaimCampaignEmail({
    step: payload.step,
    mentorName: payload.mentorName,
    claimUrl: payload.claimUrl,
    optOutUrl: payload.optOutUrl,
    hideDate: payload.hideDate,
  })

  return deliver({
    to: payload.mentorEmail,
    subject: claimCampaignSubject(payload.step, firstName(payload.mentorName)),
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: `mentor_claim_campaign_${payload.step}`,
    from: `Dario at Pupil <${ADMIN_EMAIL}>`,
    replyTo: ADMIN_EMAIL,
    headers: { 'List-Unsubscribe': `<${payload.optOutUrl}>` },
  })
}

/** Sent to student when admin assigns a mentor. */
export async function notifyStudentMatched(payload: {
  studentEmail: string
  studentName: string
  mentorName: string
  mentorUniversity: string | null
}) {
  const node = StudentMatchedEmail({
    studentName: payload.studentName,
    mentorName: payload.mentorName,
    mentorUniversity: payload.mentorUniversity,
  })

  await deliver({
    to: payload.studentEmail,
    subject: `You're matched with ${payload.mentorName} on Pupil`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'student_matched',
  })
}

/** Sent to mentor when admin assigns them a mentee. */
export async function notifyMentorAssigned(payload: {
  mentorEmail: string
  mentorName: string
  studentName: string
  studentGrade: number | null
}) {
  const node = MentorAssignedEmail({
    mentorName: payload.mentorName,
    studentName: payload.studentName,
    studentGrade: payload.studentGrade,
  })

  await deliver({
    to: payload.mentorEmail,
    subject: `${payload.studentName} is your new mentee on Pupil`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'mentor_assigned',
  })
}

/** Sent to mentor when admin approves their application. */
export async function notifyMentorApproved(payload: {
  mentorEmail: string
  mentorName: string
  mentorUserId: string
  university: string | null
}) {
  const node = MentorApprovedEmail({
    mentorName: payload.mentorName,
    mentorUserId: payload.mentorUserId,
    university: payload.university,
  })

  await deliver({
    to: payload.mentorEmail,
    subject: 'Your Pupil mentor application was approved',
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'mentor_approved',
  })
}

export interface RequestDeclinedNotification {
  studentEmail: string
  studentName: string
  mentorName: string
  reason: string | null
}

/** Sent to student when admin declines their match request. */
export async function notifyStudentOfDecline(
  payload: RequestDeclinedNotification
) {
  const node = MatchRequestDeclinedEmail({
    studentName: payload.studentName,
    mentorName: payload.mentorName,
    reason: payload.reason,
  })

  await deliver({
    to: payload.studentEmail,
    subject: `Update on your match request`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'match_request_declined',
  })
}

// ---------------------------------------------------------------------------
// Delivery shim
// ---------------------------------------------------------------------------

interface DeliverArgs {
  to: string
  subject: string
  html: string
  text: string
  tag: string
  from?: string
  replyTo?: string
  headers?: Record<string, string>
}

async function deliver({
  to,
  subject,
  html,
  text,
  tag,
  from = 'Pupil <hello@getpupil.com>',
  replyTo,
  headers,
}: DeliverArgs): Promise<boolean> {
  if (!RESEND_KEY) {
    // No key configured — log the plain-text version so we can audit what
    // would have been sent during local testing. The full HTML is preview-
    // able via `npx react-email dev`.
    console.log(
      `\n[email:${tag}] would send to ${to}\n  subject: ${subject}\n  body:\n${text
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n')}\n`
    )
    return true
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        tags: [{ name: 'category', value: tag }],
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(headers ? { headers } : {}),
      }),
    })
    if (!res.ok) {
      console.error(`[email:${tag}] Resend HTTP ${res.status}:`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error(`[email:${tag}] send failed:`, err)
    return false
  }
}

function firstName(s: string): string {
  return s.trim().split(/\s+/)[0] ?? s
}
