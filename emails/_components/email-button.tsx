import * as React from 'react'
import { Button } from '@react-email/components'

import { colors, fonts } from './theme'

/**
 * Email-safe primary CTA button.
 *
 * Why the `<!--[if mso]>` block:
 *   Outlook on Windows (Word rendering engine) ignores border-radius and
 *   padding on <a> tags. Without VML our button would look like a square
 *   underlined link. The conditional block wraps the same button in a
 *   <v:roundrect> so Outlook draws a proper rounded button.
 *
 * Why no CSS `height`:
 *   Yahoo Mail strips height. We set padding + line-height instead, which
 *   determines the button's vertical size identically across all clients.
 */
export function EmailButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const bg = variant === 'primary' ? colors.primary : colors.bgSubtle
  const fg = variant === 'primary' ? colors.primaryForeground : colors.text
  const stroke = variant === 'primary' ? colors.primary : colors.borderStrong

  return (
    <>
      {/* Outlook (Windows) — VML rounded rectangle keeps the pill shape. */}
      <span
        dangerouslySetInnerHTML={{
          __html: `<!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(href)}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" stroke="f" fillcolor="${bg}">
              <w:anchorlock/>
              <center style="color:${fg};font-family:${fonts.sans.replace(/"/g, "'")};font-size:16px;font-weight:600;">${escapeHtml(textChildren(children))}</center>
            </v:roundrect>
          <![endif]-->`,
        }}
      />

      {/* All other clients */}
      <Button
        href={href}
        style={
          {
            display: 'inline-block',
            backgroundColor: bg,
            color: fg,
            fontFamily: fonts.sans,
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '20px',
            padding: '14px 28px',
            textDecoration: 'none',
            textAlign: 'center',
            borderRadius: '8px',
            border: `1px solid ${stroke}`,
            msoHide: 'all', // hide the HTML button in Outlook (VML version shows)
          } as React.CSSProperties
        }
      >
        {children}
      </Button>
    </>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Best-effort string extraction for the VML fallback. We only render the
// button with plain text children, so this is safe in practice.
function textChildren(c: React.ReactNode): string {
  if (typeof c === 'string') return c
  if (typeof c === 'number') return String(c)
  if (Array.isArray(c)) return c.map(textChildren).join('')
  return ''
}
