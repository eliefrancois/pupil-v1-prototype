import * as React from 'react'
import { Heading, Section, Text } from '@react-email/components'

import { EmailButton } from './_components/email-button'
import { EmailShell } from './_components/email-shell'
import { SITE_URL, colors, fonts } from './_components/theme'

export interface MatchRequestAdminEmailProps {
  studentName: string
  studentEmail: string
  studentGrade: number | null
  mentorName: string
  mentorIsGhost: boolean
  message: string | null
  requestId: string
}

export default function MatchRequestAdminEmail({
  studentName = 'Alex Rivera',
  studentEmail = 'alex@example.com',
  studentGrade = 11,
  mentorName = 'Jordan Park',
  mentorIsGhost = true,
  message = 'I want help with Stanford essays and CS programs.',
  requestId = 'req_abc123',
}: MatchRequestAdminEmailProps) {
  return (
    <EmailShell
      preview={
        mentorIsGhost
          ? `[match] ${studentName} requested ghost mentor ${mentorName}`
          : `[match] ${studentName} requested ${mentorName}`
      }
      footerNote={`Internal admin notification. Request ID: ${requestId}`}
    >
      <Heading
        as="h1"
        style={{
          margin: '0 0 4px 0',
          fontFamily: fonts.serif,
          fontSize: '22px',
          fontWeight: 600,
          lineHeight: '30px',
          color: colors.text,
        }}
      >
        New match request
      </Heading>
      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          color: colors.text3,
        }}
      >
        {studentName} → {mentorName}
        {mentorIsGhost && (
          <span
            style={{
              display: 'inline-block',
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: colors.bgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              color: colors.text2,
              verticalAlign: 'middle',
            }}
          >
            GHOST · needs claim email
          </span>
        )}
      </Text>

      {/* Detail rows. Plain table-ish layout for max client compatibility. */}
      <Section style={{ margin: '0 0 20px 0' }}>
        <DetailRow label="Student">
          {studentName} ({studentEmail})
          {studentGrade ? `, grade ${studentGrade}` : null}
        </DetailRow>
        <DetailRow label="Mentor">
          {mentorName}
          {mentorIsGhost ? ' (ghost — needs claim email)' : ''}
        </DetailRow>
      </Section>

      {message && (
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
            Student message
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '22px',
              color: colors.text,
            }}
          >
            {message}
          </Text>
        </Section>
      )}

      <Section style={{ padding: '4px 0 4px 0', textAlign: 'center' }}>
        <EmailButton href={`${SITE_URL}/admin/requests`}>
          Review in admin
        </EmailButton>
      </Section>
    </EmailShell>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Text
      style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        lineHeight: '22px',
        color: colors.text,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          minWidth: '70px',
          fontWeight: 600,
          color: colors.text3,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          verticalAlign: 'middle',
        }}
      >
        {label}
      </span>{' '}
      <span style={{ color: colors.text2 }}>{children}</span>
    </Text>
  )
}
