import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MentorApprovedEmailProps {
  mentorName: string
  mentorUserId: string
  university?: string | null
}

export default function MentorApprovedEmail({
  mentorName = 'Jordan',
  mentorUserId = '9faea745-98e5-43f3-9892-7ae526734b07',
  university = 'New York University',
}: MentorApprovedEmailProps) {
  const firstName = mentorName.trim().split(/\s+/)[0]
  const profileUrl = `${SITE_URL}/mentors/${mentorUserId}`

  return (
    <EmailShell
      preview="Your Pupil mentor application was approved"
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
        Hi {firstName}, you're approved.
      </Heading>

      <Text
        style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Your mentor application on Pupil was approved
        {university ? ` (${university})` : ''}. Your profile is live in the
        mentor directory and you're eligible to be matched with students.
      </Text>

      <Section
        style={{
          backgroundColor: colors.primarySoft,
          borderLeft: `3px solid ${colors.primary}`,
          padding: '14px 16px',
          margin: '0 0 24px 0',
          borderRadius: '6px',
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '22px',
            color: colors.text,
          }}
        >
          Next step: open your mentor dashboard, confirm your availability,
          and keep an eye out for mentee assignments from our team.
        </Text>
      </Section>

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/mentor`}>Open mentor dashboard</EmailButton>
      </Section>

      <Text
        style={{
          margin: '20px 0 0 0',
          fontSize: '13px',
          lineHeight: '20px',
          color: colors.text3,
        }}
      >
        Your public profile:{' '}
        <a href={profileUrl} style={{ color: colors.primary }}>
          {profileUrl}
        </a>
      </Text>
    </EmailShell>
  )
}
