import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface ReminderDigestEmailProps {
  stuckMentors: { name: string; waiting: number; daysSinceApproval: number | null }[]
  silentStudents: { name: string; mentorName: string; daysMatched: number }[]
  rematchStudents: { name: string; mentorName: string; daysFlagged: number }[]
  sends: { label: string; sent: number; converted: number }[]
  totals: { sent: number; converted: number; failed: number }
}

const sectionHeading: React.CSSProperties = {
  margin: '24px 0 8px 0',
  fontSize: '15px',
  fontWeight: 600,
  color: colors.text,
}

const line: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '14px',
  lineHeight: '22px',
  color: colors.text2,
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Text style={line}>{empty}</Text>
  return (
    <>
      {items.map((item) => (
        <Text key={item} style={line}>
          {`\u2022 ${item}`}
        </Text>
      ))}
    </>
  )
}

/** Monday morning summary for Dario. Internal only. */
export default function ReminderDigestEmail({
  stuckMentors = [{ name: 'Jordan Park', waiting: 2, daysSinceApproval: 12 }],
  silentStudents = [{ name: 'Alex R.', mentorName: 'Jordan Park', daysMatched: 9 }],
  rematchStudents = [],
  sends = [{ label: 'Student: say hi to your mentor', sent: 6, converted: 2 }],
  totals = { sent: 6, converted: 2, failed: 0 },
}: ReminderDigestEmailProps) {
  return (
    <EmailShell preview={`${stuckMentors.length} mentors without times, ${silentStudents.length} quiet students`}>
      <Heading
        as="h1"
        style={{
          margin: '0 0 8px 0',
          fontFamily: fonts.serif,
          fontSize: '24px',
          fontWeight: 600,
          lineHeight: '32px',
          color: colors.text,
        }}
      >
        Your weekly Pupil check in
      </Heading>

      <Text style={sectionHeading}>Mentors with matched students but no availability</Text>
      <List
        empty="None this week."
        items={stuckMentors.map(
          (m) =>
            `${m.name}: ${m.waiting} waiting${
              m.daysSinceApproval !== null ? `, approved ${m.daysSinceApproval} days ago` : ''
            }`
        )}
      />

      <Text style={sectionHeading}>Students matched 7+ days ago who never messaged</Text>
      <List
        empty="None this week."
        items={silentStudents.map((s) => `${s.name}, with ${s.mentorName}, ${s.daysMatched} days`)}
      />

      <Text style={sectionHeading}>Flagged for a new mentor</Text>
      <List
        empty="Nobody flagged."
        items={rematchStudents.map(
          (s) => `${s.name}, with ${s.mentorName}, flagged ${s.daysFlagged} days ago`
        )}
      />

      <Text style={sectionHeading}>Reminder emails last week</Text>
      <Text style={line}>
        {`${totals.sent} sent, ${totals.converted} converted within 3 days${
          totals.failed ? `, ${totals.failed} failed` : ''
        }.`}
      </Text>
      <List
        empty="No reminders went out."
        items={sends.filter((s) => s.sent > 0).map((s) => `${s.label}: ${s.sent} sent, ${s.converted} converted`)}
      />

      <Section style={{ padding: '24px 0 0 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/admin/reminders`}>Open reminders</EmailButton>
      </Section>
    </EmailShell>
  )
}
