import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MenteeFirstMessageEmailProps {
  mentorName: string
  studentName: string
}

export default function MenteeFirstMessageEmail({
  mentorName = 'Jordan',
  studentName = 'Alex',
}: MenteeFirstMessageEmailProps) {
  const mentorFirstName = mentorName.trim().split(/\s+/)[0]
  const studentFirstName = studentName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`${studentFirstName} sent you a message on Pupil`}
      footerNote="You're getting this because your mentee reached out for the first time. We won't email you for every message."
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
        Hi {mentorFirstName}, {studentFirstName} said hello.
      </Heading>

      <Text
        style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        <strong>{studentFirstName}</strong> sent you a message on Pupil. Log in
        to read it and reply.
      </Text>

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/mentor/messages`}>
          Log in to reply
        </EmailButton>
      </Section>
    </EmailShell>
  )
}
