import { createEvent, type EventAttributes } from 'ics'
import { Resend } from 'resend'

import { ET, formatSlot } from '@/lib/scheduling/slots'

type Party = { email: string; name: string | null }

/**
 * Generates an ICS attachment + sends a confirmation email to both parties
 * via Resend. No-op (with a console warning) if RESEND_API_KEY is missing,
 * which is the V0 dev default.
 */
export async function sendBookingConfirmation(params: {
  bookingId: string
  startsAt: Date
  student: Party
  mentor: Party
  durationMinutes?: number
}) {
  const { bookingId, startsAt, student, mentor, durationMinutes = 30 } = params

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      '[email] RESEND_API_KEY not set; skipping booking confirmation email.'
    )
    return
  }

  const resend = new Resend(apiKey)
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS ?? 'Pupil <hello@getpupil.com>'

  const icsAttachment = await buildIcs({
    bookingId,
    startsAt,
    durationMinutes,
    student,
    mentor,
  })

  const slotLabel = formatSlot(startsAt, ET)

  const studentSubject = `Booked: session with ${mentor.name ?? 'your mentor'} on ${slotLabel}`
  const mentorSubject = `New booking: ${student.name ?? 'a student'} on ${slotLabel}`

  const studentBody = renderEmailBody({
    greeting: `Hi ${firstName(student.name)},`,
    body: `You've booked a 30-minute session with ${mentor.name ?? 'your mentor'} on ${slotLabel}. We've attached a calendar invite so you don't lose track of it. We'll send a reminder before the call.`,
  })
  const mentorBody = renderEmailBody({
    greeting: `Hi ${firstName(mentor.name)},`,
    body: `${student.name ?? 'A student'} just booked a 30-minute session with you on ${slotLabel}. We've attached a calendar invite. They'll see your icebreakers and a "Join" button on their dashboard at session time.`,
  })

  await Promise.all([
    resend.emails.send({
      from: fromAddress,
      to: student.email,
      subject: studentSubject,
      html: studentBody,
      attachments: icsAttachment ? [icsAttachment] : undefined,
    }),
    resend.emails.send({
      from: fromAddress,
      to: mentor.email,
      subject: mentorSubject,
      html: mentorBody,
      attachments: icsAttachment ? [icsAttachment] : undefined,
    }),
  ])
}

async function buildIcs(input: {
  bookingId: string
  startsAt: Date
  durationMinutes: number
  student: Party
  mentor: Party
}): Promise<{ filename: string; content: Buffer } | null> {
  const start = input.startsAt
  const event: EventAttributes = {
    title: `Pupil session: ${input.student.name ?? 'student'} & ${input.mentor.name ?? 'mentor'}`,
    description: 'Pupil mentorship session. Join from your dashboard.',
    busyStatus: 'BUSY',
    start: [
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
    ],
    startInputType: 'utc',
    duration: { minutes: input.durationMinutes },
    organizer: { name: 'Pupil', email: 'hello@getpupil.com' },
    attendees: [
      input.student.email
        ? {
            name: input.student.name ?? undefined,
            email: input.student.email,
            rsvp: true,
          }
        : null,
      input.mentor.email
        ? {
            name: input.mentor.name ?? undefined,
            email: input.mentor.email,
            rsvp: true,
          }
        : null,
    ].filter((a): a is NonNullable<typeof a> => Boolean(a)),
    uid: `pupil-booking-${input.bookingId}@getpupil.com`,
  }

  return new Promise((resolve) => {
    createEvent(event, (error, value) => {
      if (error || !value) {
        console.warn('[email] failed to build ICS:', error)
        resolve(null)
        return
      }
      resolve({
        filename: 'pupil-session.ics',
        content: Buffer.from(value, 'utf-8'),
      })
    })
  })
}

function firstName(full: string | null): string {
  if (!full) return 'there'
  return full.split(' ')[0] || 'there'
}

function renderEmailBody({
  greeting,
  body,
}: {
  greeting: string
  body: string
}): string {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 24px; max-width: 560px;">
    <p style="margin: 0 0 16px;">${greeting}</p>
    <p style="margin: 0 0 16px; line-height: 1.55;">${body}</p>
    <p style="margin: 24px 0 0; color: #6b6b80; font-size: 12px;">- Pupil</p>
  </body>
</html>`
}
