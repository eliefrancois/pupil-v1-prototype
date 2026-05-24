'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Loader as Loader2, MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { regenerateClaimToken } from './actions'

export default function ExpiredActions({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    setError('')
    setLoading(true)
    const result = await regenerateClaimToken(token)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <MailCheck className="h-5 w-5" />
        </div>
        <h2 className="display text-[22px]">Fresh link on the way</h2>
        <p className="mt-2 text-[14px] text-text-2">
          We sent a new claim link to{' '}
          <span className="font-medium text-text">{email}</span>. It&apos;s
          good for 30 days. Check your inbox.
        </p>
        <Button asChild variant="ghost" className="mt-6">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(245,158,11,0.1)] text-[#B45309]">
        <Clock className="h-5 w-5" />
      </div>
      <h2 className="display text-[22px]">This link has expired</h2>
      <p className="mt-2 text-[14px] text-text-2">
        Your claim link for{' '}
        <span className="font-medium text-text">{email}</span> is past its 30
        day window. Get a fresh one and we&apos;ll send it over.
      </p>

      {error && (
        <div className="mt-4 w-full rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <Button onClick={handleResend} disabled={loading} className="mt-6 w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending a fresh link...
          </>
        ) : (
          'Send me a new link'
        )}
      </Button>
      <Button asChild variant="ghost" className="mt-2">
        <Link href="/login">I already have an account</Link>
      </Button>
    </div>
  )
}
