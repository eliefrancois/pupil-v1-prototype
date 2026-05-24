import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { SITE_URL, colors, fonts } from './theme'

/**
 * Shared Pupil email shell. Provides the wordmark header, surrounding
 * surface, and the legal/unsubscribe footer. Per-template content goes
 * into `children`.
 *
 * Layout notes:
 *   - All width is on a Container (640px max). Email clients clamp wider.
 *   - The off-white page bg + white card pattern mirrors the app.
 *   - We never set CSS `height` (Yahoo strips it). Padding does the work.
 */
export function EmailShell({
  preview,
  children,
  footerNote,
}: {
  preview: string
  children: React.ReactNode
  footerNote?: string
}) {
  return (
    <Html>
      <Head>
        {/* Force light mode where supported. Some Gmail dark-mode inversions
            butcher purple-on-white; this hints clients to render as designed. */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.bgPage,
          fontFamily: fonts.sans,
          color: colors.text,
        }}
      >
        <Container
          style={{
            width: '100%',
            maxWidth: '640px',
            margin: '0 auto',
            padding: '24px 16px',
          }}
        >
          {/* Wordmark header */}
          <Section style={{ padding: '8px 4px 20px 4px' }}>
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.serif,
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: colors.text,
              }}
            >
              Pupil
            </Text>
          </Section>

          {/* Main card */}
          <Section
            style={{
              backgroundColor: colors.bg,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              padding: '32px 28px',
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ padding: '24px 8px 8px 8px' }}>
            <Hr
              style={{
                borderColor: colors.border,
                borderTop: `1px solid ${colors.border}`,
                margin: '0 0 16px 0',
              }}
            />
            {footerNote && (
              <Text
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: colors.text3,
                }}
              >
                {footerNote}
              </Text>
            )}
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '18px',
                color: colors.text3,
              }}
            >
              Pupil is a college mentorship platform connecting high school
              students with current college students for guidance on
              applications and college life.
              <br />
              <Link href={SITE_URL} style={{ color: colors.text2 }}>
                {SITE_URL.replace(/^https?:\/\//, '')}
              </Link>
              {' · '}
              <Link
                href={`${SITE_URL}/contact`}
                style={{ color: colors.text2 }}
              >
                Contact
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
