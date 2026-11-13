import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

// Self-hosted: next/font/google intermittently fails Vercel builds when Google
// returns a font URL without a file extension. These are Google's latin subset files.
const newsreader = localFont({
  src: [
    { path: './fonts/Newsreader-Latin.woff2', weight: '400 600', style: 'normal' },
    { path: './fonts/Newsreader-Latin-Italic.woff2', weight: '400 600', style: 'italic' },
  ],
  variable: '--font-newsreader',
  display: 'swap',
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'Pupil - College Guidance Your Family Can Trust',
  description:
    'Pupil connects your student with relatable near-peer college mentors who share their goals, identity, and vibe.',
  appleWebApp: { title: 'Pupil' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable}`}
    >
      <body className="antialiased">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
