'use client'

import { useState, useTransition } from 'react'
import { Loader as Loader2, X } from 'lucide-react'

import { cancelMatchRequest } from '@/lib/actions/match-request-actions'

export default function CancelRequestButton({
  requestId,
}: {
  requestId: string
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setError('')
    startTransition(async () => {
      const result = await cancelMatchRequest(requestId)
      if (!result.ok) {
        setError(result.error)
        setConfirming(false)
      }
    })
  }

  if (error) {
    return (
      <span className="text-[11px] text-[#B91C1C]" role="alert">
        {error}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-text-3 transition-colors hover:bg-bg-2 hover:text-text disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Cancelling
        </>
      ) : confirming ? (
        <>
          <X className="h-3 w-3" />
          Sure?
        </>
      ) : (
        <>
          <X className="h-3 w-3" />
          Cancel
        </>
      )}
    </button>
  )
}
