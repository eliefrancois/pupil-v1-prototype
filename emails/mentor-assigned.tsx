import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MentorAssignedEmailProps {
  mentorName: string
  studentName: string
  studentGrade?: number | null
}

export default function MentorAssignedEmail({
  mentorName = 'Jordan',
  studentName = 'Alex',
  studentGrade = 11,
}: MentorAssignedEmailProps) {
  const firstName = mentorName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`${studentName} is your new mentee on Pupil`}
      footerNote="Sign in to your mentor dashboard to view their profile and availability."
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
        Hi {firstName}, you have a new mentee.
      </Heading>

      <Text
        style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        <strong>{studentName}</strong>
        {studentGrade ? ` (grade ${studentGrade})` : ''} has been assigned to
        you on Pupil. They may book sessions based on your shared availability.
      </Text>

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/mentor`}>Open mentor dashboard</EmailButton>
      </Section>
    </EmailShell>
  )
}
