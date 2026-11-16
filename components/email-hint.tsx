'use client'

import { useMemo } from 'react'

import { suggestEmail, validateEmail } from '@/lib/validation/email'

export default function EmailHint({
  email,
  showError,
  onAccept,
}: {
  email: string
  showError: boolean
  onAccept: (email: string) => void
}) {
  const suggestion = useMemo(() => suggestEmail(email), [email])
  const error = showError && email.trim() ? validateEmail(email) : null

  if (!suggestion && !error) return null

  return (
    <div className="space-y-1">
      {suggestion && (
        <p className="text-[12px] text-text-2">
          Did you mean{' '}
          <button
            type="button"
            onClick={() => onAccept(suggestion)}
            className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            {suggestion}
          </button>
          ?
        </p>
      )}
      {error && <p className="text-[12px] text-[#B91C1C]">{error}</p>}
    </div>
  )
}
