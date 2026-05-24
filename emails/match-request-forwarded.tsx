import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MatchRequestForwardedEmailProps {
  mentorName: string
  studentName: string
  studentMessage?: string | null
}

export default function MatchRequestForwardedEmail({
  mentorName = 'Jordan',
  studentName = 'Alex',
  studentMessage = 'I want to apply to Stanford and would love to talk through essays.',
}: MatchRequestForwardedEmailProps) {
  const firstName = mentorName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`${studentName} wants to work with you on Pupil`}
      footerNote="Sign in to your mentor dashboard to accept or decline this request."
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
        Hi {firstName}, you have a new mentor request.
      </Heading>

      <Text
        style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        <strong>{studentName}</strong> asked to be matched with you on Pupil.
        Take a look at their note and decide if it sounds like a fit.
      </Text>

      {studentMessage && (
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
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.text3,
            }}
          >
            What {studentName.split(/\s+/)[0]} wrote
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '22px',
              color: colors.text,
            }}
          >
            {studentMessage}
          </Text>
        </Section>
      )}

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/mentor`}>Review in dashboard</EmailButton>
      </Section>

      <Text
        style={{
          margin: '20px 0 0 0',
          fontSize: '13px',
          lineHeight: '20px',
          color: colors.text3,
        }}
      >
        If you can’t take new mentees right now, you can decline from
        the dashboard. No follow-up from us either way.
      </Text>
    </EmailShell>
  )
}
