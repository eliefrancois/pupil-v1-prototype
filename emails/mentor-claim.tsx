import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { colors, fonts } from './_components/theme'

export interface MentorClaimEmailProps {
  mentorName: string
  claimUrl: string
  /** If a specific student requested this mentor, mention them by name. */
  requestingStudentName?: string | null
  /** Days until the claim token expires. */
  daysToExpiry?: number
}

export default function MentorClaimEmail({
  mentorName = 'Jordan',
  claimUrl = 'https://getpupil.com/mentor-claim/example-token',
  requestingStudentName = null,
  daysToExpiry = 30,
}: MentorClaimEmailProps) {
  const firstName = mentorName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={
        requestingStudentName
          ? `${requestingStudentName} wants you as their mentor on Pupil`
          : `Claim your Pupil mentor profile, ${firstName}`
      }
      footerNote={`This claim link expires in ${daysToExpiry} days. If you didn’t fill out our mentor survey, you can ignore this email.`}
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
        Hi {firstName}, your mentor profile is ready.
      </Heading>

      <Text
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        You filled out our mentor survey a while back. We built you a draft
        profile on Pupil, the college mentorship platform connecting near-peer
        college students with high schoolers figuring out applications.
      </Text>

      {requestingStudentName && (
        <Section
          style={{
            backgroundColor: colors.primarySoft,
            borderLeft: `3px solid ${colors.primary}`,
            padding: '14px 16px',
            margin: '8px 0 20px 0',
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
            <strong>{requestingStudentName}</strong>, a student on Pupil, just
            asked to be matched with you. Claim your profile to take a look at
            their request.
          </Text>
        </Section>
      )}

      <Text
        style={{
          margin: '20px 0 8px 0',
          fontSize: '16px',
          lineHeight: '26px',
          color: colors.text2,
        }}
      >
        Claim your profile to set a password, review your draft bio, and
        choose how many students you want to mentor.
      </Text>

      <Section style={{ padding: '24px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={claimUrl}>Claim my profile</EmailButton>
      </Section>

      <Text
        style={{
          margin: '20px 0 0 0',
          fontSize: '13px',
          lineHeight: '20px',
          color: colors.text3,
        }}
      >
        Or paste this link into your browser:
        <br />
        <span style={{ wordBreak: 'break-all', color: colors.text2 }}>
          {claimUrl}
        </span>
      </Text>

      <Section style={{ padding: '28px 0 0 0' }}>
        <Text
          style={{
            margin: '0 0 8px 0',
            fontSize: '13px',
            lineHeight: '20px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          What being a mentor looks like
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '20px',
            color: colors.text2,
          }}
        >
          One or two 30-minute video calls per month with a student matched to
          your interests and background. You set your availability and pick
          your max number of mentees. Compensation details on your dashboard.
        </Text>
      </Section>
    </EmailShell>
  )
}
