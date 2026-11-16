import * as React from 'react'
import { Heading, Text } from '@react-email/components'

import { EmailShell } from './_components/email-shell'
import { colors, fonts } from './_components/theme'

export interface EligibilityCounselorEmailProps {
  parentName: string
  studentName: string
  grade: number
  school: string
}

const paragraph = {
  margin: '0 0 16px 0',
  fontSize: '16px',
  lineHeight: '26px',
  color: colors.text2,
}

export default function EligibilityCounselorEmail({
  parentName = 'Maria Lopez',
  studentName = 'Alex Lopez',
  grade = 11,
  school = 'Lincoln High School',
}: EligibilityCounselorEmailProps) {
  const studentFirstName = studentName.trim().split(/\s+/)[0]

  return (
    <EmailShell
      preview={`${parentName} applied for free Pupil access for ${studentName}. A quick reply confirms it.`}
      footerNote="Questions? Just reply. This goes straight to Dario at Pupil."
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
        Can you confirm a student&apos;s eligibility?
      </Heading>

      <Text style={paragraph}>Hi there,</Text>

      <Text style={paragraph}>
        {parentName} applied for free access to Pupil for{' '}
        <strong>{studentName}</strong>, a grade {grade} student at{' '}
        <strong>{school}</strong>, and listed you as the school counselor.
      </Text>

      <Text style={paragraph}>
        Pupil pairs high school students with college mentors for help with
        applications and planning. We offer it free to students whose families
        qualify.
      </Text>

      <Text style={paragraph}>
        Could you reply to this email to confirm {studentFirstName} is eligible?
        A quick yes or no is plenty. We don&apos;t need documents or any other
        details.
      </Text>

      <Text style={{ ...paragraph, margin: '0' }}>
        The family is copied here so everyone stays in the loop.
      </Text>
    </EmailShell>
  )
}
