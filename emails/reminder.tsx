import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface ReminderEmailProps {
  preview: string
  heading: string
  paragraphs: string[]
  ctaLabel: string
  ctaUrl: string
  unsubscribeUrl: string
}

/** Lifecycle reminder from Dario. Copy lives in lib/reminders/copy.ts. */
export default function ReminderEmail({
  preview = 'Jordan is waiting to hear from you',
  heading = 'Hi Alex, say hi to Jordan',
  paragraphs = [
    "You're matched with Jordan from Georgetown. Mentors on Pupil can only reply, so the first message has to come from you.",
    "It doesn't need to be long. Say hi, what grade you're in, and one thing you're wondering about college.",
  ],
  ctaLabel = 'Send a message',
  ctaUrl = `${SITE_URL}/dashboard/messages`,
  unsubscribeUrl = `${SITE_URL}/unsubscribe`,
}: ReminderEmailProps) {
  return (
    <EmailShell
      preview={preview}
      footerNote="You're getting this because you have a Pupil account. We send a few reminders and then stop."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading
        as="h1"
        style={{
          margin: '0 0 16px 0',
          fontFamily: fonts.serif,
          fontSize: '26px',
          fontWeight: 600,
          lineHeight: '34px',
          letterSpacing: '-0.01em',
          color: colors.text,
        }}
      >
        {heading}
      </Heading>

      {paragraphs.map((p) => (
        <Text
          key={p}
          style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            lineHeight: '26px',
            color: colors.text2,
          }}
        >
          {p}
        </Text>
      ))}

      <Section style={{ padding: '8px 0 16px 0', textAlign: 'center' }}>
        <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
      </Section>

      <Text
        style={{
          margin: 0,
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Dario
        <br />
        Pupil
      </Text>
    </EmailShell>
  )
}
