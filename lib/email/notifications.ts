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
import MenteeFirstMessageEmail from '@/emails/mentee-first-message'
import EligibilityCounselorEmail from '@/emails/eligibility-counselor'
import MentorAssignedEmail from '@/emails/mentor-assigned'
import MentorApprovedEmail from '@/emails/mentor-approved'
import ReminderEmail from '@/emails/reminder'

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

  const mentorFirstName = firstName(payload.mentorName)
  await deliver({
    to: payload.studentEmail,
    subject: payload.mentorUniversity
      ? `You're matched with ${mentorFirstName} from ${payload.mentorUniversity}`
      : `You're matched with ${mentorFirstName} on Pupil`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'student_matched',
  })
}

/**
 * Sent to a mentor the first time their mentee messages them. Never includes
 * message content.
 */
export async function notifyMentorOfFirstMessage(payload: {
  mentorEmail: string
  mentorName: string
  studentName: string
}) {
  const node = MenteeFirstMessageEmail({
    mentorName: payload.mentorName,
    studentName: payload.studentName,
  })

  await deliver({
    to: payload.mentorEmail,
    subject: `${firstName(payload.studentName)} sent you a message, log in to reply`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'mentee_first_message',
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
// Free access (eligibility) emails
// ---------------------------------------------------------------------------

/**
 * Sent to the counselor a family listed on /access, CCing the family and
 * admin, asking them to reply to confirm eligibility. Returns whether
 * Resend accepted it.
 */
export async function notifyCounselorOfEligibilityApplication(payload: {
  counselorEmail: string
  familyEmails: string[]
  parentName: string
  studentName: string
  grade: number
  school: string
}): Promise<boolean> {
  const node = EligibilityCounselorEmail({
    parentName: payload.parentName,
    studentName: payload.studentName,
    grade: payload.grade,
    school: payload.school,
  })

  return deliver({
    to: payload.counselorEmail,
    cc: Array.from(new Set([...payload.familyEmails, ADMIN_EMAIL])),
    subject: `Can you confirm free Pupil access for ${payload.studentName}?`,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: 'eligibility_counselor',
    from: `Dario at Pupil <${ADMIN_EMAIL}>`,
    replyTo: ADMIN_EMAIL,
  })
}

// ---------------------------------------------------------------------------
// Lifecycle reminders
// ---------------------------------------------------------------------------

export interface ReminderNotification {
  to: string
  cc?: string[]
  tag: string
  subject: string
  preview: string
  heading: string
  paragraphs: string[]
  ctaLabel: string
  ctaUrl: string
  unsubscribeUrl: string
  /** POST target for Gmail/Yahoo one-click unsubscribe. */
  oneClickUnsubscribeUrl: string
}

/** A reminder email from Dario with one-click unsubscribe headers. */
export async function notifyReminder(payload: ReminderNotification): Promise<DeliveryResult> {
  const node = ReminderEmail({
    preview: payload.preview,
    heading: payload.heading,
    paragraphs: payload.paragraphs,
    ctaLabel: payload.ctaLabel,
    ctaUrl: payload.ctaUrl,
    unsubscribeUrl: payload.unsubscribeUrl,
  })

  return send({
    to: payload.to,
    cc: payload.cc,
    subject: payload.subject,
    html: await render(node),
    text: await render(node, { plainText: true }),
    tag: payload.tag,
    from: `Dario at Pupil <${ADMIN_EMAIL}>`,
    replyTo: ADMIN_EMAIL,
    headers: {
      'List-Unsubscribe': `<${payload.oneClickUnsubscribeUrl}>, <mailto:${ADMIN_EMAIL}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })
}

/** Plain-text render of a reminder, for previews and the admin dry-run view. */
export async function renderReminderText(
  payload: Omit<ReminderNotification, 'to' | 'cc' | 'tag' | 'oneClickUnsubscribeUrl'>
): Promise<string> {
  return render(
    ReminderEmail({
      preview: payload.preview,
      heading: payload.heading,
      paragraphs: payload.paragraphs,
      ctaLabel: payload.ctaLabel,
      ctaUrl: payload.ctaUrl,
      unsubscribeUrl: payload.unsubscribeUrl,
    }),
    { plainText: true }
  )
}

// ---------------------------------------------------------------------------
// Delivery shim
// ---------------------------------------------------------------------------

interface DeliverArgs {
  to: string
  cc?: string[]
  subject: string
  html: string
  text: string
  tag: string
  from?: string
  replyTo?: string
  headers?: Record<string, string>
}

export interface DeliveryResult {
  ok: boolean
  error?: string
  /** Resend refused the address (suppression list, prior bounce or complaint). */
  undeliverable?: boolean
}

const UNDELIVERABLE_PATTERN = /suppress|bounce|complain|blocked|invalid.*(recipient|to)/i

async function deliver(args: DeliverArgs): Promise<boolean> {
  return (await send(args)).ok
}

async function send({
  to,
  cc,
  subject,
  html,
  text,
  tag,
  from = 'Pupil <hello@getpupil.com>',
  replyTo,
  headers,
}: DeliverArgs): Promise<DeliveryResult> {
  if (!RESEND_KEY) {
    // No key configured — log the plain-text version so we can audit what
    // would have been sent during local testing. The full HTML is preview-
    // able via `npx react-email dev`.
    console.log(
      `\n[email:${tag}] would send to ${to}${
        cc?.length ? `\n  cc: ${cc.join(', ')}` : ''
      }\n  subject: ${subject}\n  body:\n${text
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n')}\n`
    )
    return { ok: true }
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
        ...(cc?.length ? { cc } : {}),
        subject,
        html,
        text,
        tags: [{ name: 'category', value: tag }],
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(headers ? { headers } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[email:${tag}] Resend HTTP ${res.status}:`, body)
      return {
        ok: false,
        error: `HTTP ${res.status}: ${body.slice(0, 300)}`,
        undeliverable: res.status >= 400 && res.status < 500 && UNDELIVERABLE_PATTERN.test(body),
      }
    }
    return { ok: true }
  } catch (err) {
    console.error(`[email:${tag}] send failed:`, err)
    return { ok: false, error: err instanceof Error ? err.message : 'send failed' }
  }
}

function firstName(s: string): string {
  return s.trim().split(/\s+/)[0] ?? s
}
