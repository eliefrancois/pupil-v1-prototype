import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MatchRequestDeclinedEmailProps {
  studentName: string
  mentorName: string
  reason?: string | null
}

export default function MatchRequestDeclinedEmail({
  studentName = 'Alex',
  mentorName = 'Jordan Park',
  reason = null,
}: MatchRequestDeclinedEmailProps) {
  const firstName = studentName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`Update on your match request with ${mentorName}`}
      footerNote="We’ll keep working on finding you a great mentor fit."
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
        Hey {firstName}, quick update.
      </Heading>

      <Text
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Your request to be matched with <strong>{mentorName}</strong> isn’t
        going to work out right now. It happens. Don’t take it personally.
      </Text>

      {reason && (
        <Section
          style={{
            backgroundColor: colors.bgSubtle,
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
            Reason
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '22px',
              color: colors.text,
            }}
          >
            {reason}
          </Text>
        </Section>
      )}

      <Text
        style={{
          margin: '20px 0 24px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Browse other mentors and request someone else. You can have up to
        five active requests at a time.
      </Text>

      <Section style={{ textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/mentors`}>Browse mentors</EmailButton>
      </Section>
    </EmailShell>
  )
}
