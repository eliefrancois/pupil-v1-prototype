import * as React from 'react'
import { Heading, Link, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { colors, fonts } from './_components/theme'

export type ClaimCampaignStep = 1 | 2 | 3

export interface MentorClaimCampaignEmailProps {
  step: ClaimCampaignStep
  mentorName: string
  claimUrl: string
  optOutUrl: string
  /** Shown in the final email: the day an unclaimed profile comes down. */
  hideDate: string
}

export function claimCampaignSubject(step: ClaimCampaignStep, firstName: string) {
  if (step === 1) return `Your Pupil mentor profile is ready, ${firstName}`
  if (step === 2) return `Following up on your Pupil mentor profile`
  return `Taking your Pupil profile down soon`
}

const bodyText = {
  margin: '0 0 16px 0',
  fontSize: '16px',
  lineHeight: '26px',
  color: colors.text2,
} as const

export default function MentorClaimCampaignEmail({
  step = 1,
  mentorName = 'Jordan Lee',
  claimUrl = 'https://getpupil.com/mentor-claim/example-token',
  optOutUrl = 'https://getpupil.com/mentor-optout/example-token',
  hideDate = 'December 12',
}: MentorClaimCampaignEmailProps) {
  const firstName = mentorName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={
        step === 3
          ? `Claim your profile by ${hideDate} or we'll take it off the directory`
          : `Claim your Pupil mentor profile, ${firstName}`
      }
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
        Hi {firstName},
      </Heading>

      {step === 1 && (
        <>
          <Text style={bodyText}>
            Back in 2023 you filled out our survey about mentoring high
            schoolers through college applications. We&apos;ve since built
            Pupil, and we put together a draft mentor profile from your
            answers.
          </Text>
          <Text style={bodyText}>
            Students on Pupil book 30-minute video calls with college students
            who went through the process recently. You choose how many students
            you take and when you&apos;re free.
          </Text>
        </>
      )}

      {step === 2 && (
        <Text style={bodyText}>
          Bumping this in case it got buried. We made you a draft mentor
          profile on Pupil from the survey you filled out in 2023. High
          schoolers can find you on our mentor directory, and claiming it lets
          you set your availability and start mentoring.
        </Text>
      )}

      {step === 3 && (
        <Text style={bodyText}>
          Last note from me on this. Your draft mentor profile on Pupil
          hasn&apos;t been claimed yet, so we&apos;ll take it off the public
          directory on {hideDate}. If you want to mentor, claiming it takes
          about 5 minutes. If not, no action needed.
        </Text>
      )}

      <Section style={{ padding: '8px 0 8px 0', textAlign: 'center' }}>
        <EmailButton href={claimUrl}>Claim my profile</EmailButton>
      </Section>

      {step === 1 && (
        <Text style={{ ...bodyText, margin: '16px 0 0 0' }}>
          It takes about 5 minutes: set a password, check the bio we drafted,
          and set your availability.
        </Text>
      )}

      <Text style={{ ...bodyText, margin: '20px 0 0 0' }}>
        Dario
        <br />
        Pupil
      </Text>

      <Text
        style={{
          margin: '24px 0 0 0',
          fontSize: '13px',
          lineHeight: '20px',
          color: colors.text3,
        }}
      >
        Rather not be listed?{' '}
        <Link href={optOutUrl} style={{ color: colors.text2 }}>
          Remove my profile
        </Link>{' '}
        and we won&apos;t email you about this again.
      </Text>
    </EmailShell>
  )
}
