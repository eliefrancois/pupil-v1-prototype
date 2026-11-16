'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { openBillingPortal } from '@/lib/billing/client'

export default function ManageBillingButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setPending(true)
    setError(null)
    const result = await openBillingPortal()
    if (result.ok) {
      window.location.href = result.url
      return
    }
    setPending(false)
    setError(result.error)
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleClick} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Manage billing
      </Button>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
