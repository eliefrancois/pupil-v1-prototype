import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface StudentMatchedEmailProps {
  studentName: string
  mentorName: string
  mentorUniversity?: string | null
}

export default function StudentMatchedEmail({
  studentName = 'Alex',
  mentorName = 'Jordan Chen',
  mentorUniversity = 'Stanford University',
}: StudentMatchedEmailProps) {
  const firstName = studentName.trim().split(/\s+/)[0]
  const mentorFirstName = mentorName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`You've been matched with ${mentorFirstName}. Send them a quick hello to get started.`}
      footerNote="Questions? Reply to this email or reach us at dario@getpupil.com."
    >
      <Heading
        as="h1"
        style={{
          margin: '0 0 16px 0',
          fontFamily: fonts.serif,
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: '36px',
          letterSpacing: '-0.01em',
          color: colors.text,
        }}
      >
        Hi {firstName}, you&apos;re matched.
      </Heading>

      <Text
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        You&apos;ve been matched with <strong>{mentorFirstName}</strong>
        {mentorUniversity ? ` from ${mentorUniversity}` : ''}.
      </Text>

      <Text
        style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Log in and send them a quick hello to get started. Your mentor can
        reply once you reach out.
      </Text>

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/dashboard/messages`}>
          Say hello to {mentorFirstName}
        </EmailButton>
      </Section>
    </EmailShell>
  )
}
