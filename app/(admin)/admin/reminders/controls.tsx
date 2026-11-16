'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader as Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { sendSampleReminders, setReminderEnabled } from './actions'

export function ReminderToggle({ reminderKey, enabled }: { reminderKey: string; enabled: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={enabled ? 'outline' : 'default'}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError('')
            const result = await setReminderEnabled(reminderKey, !enabled)
            if (!result.ok) setError(result.error)
            router.refresh()
          })
        }
      >
        {pending && <Loader2 className="mr-2 animate-spin" />}
        {enabled ? 'Turn off' : 'Turn on'}
      </Button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  )
}

export function SampleSender() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const send = (allRounds: boolean) =>
    startTransition(async () => {
      setMessage(null)
      const result = await sendSampleReminders(allRounds)
      setMessage(
        result.ok
          ? { ok: true, text: result.message ?? 'Sent.' }
          : { ok: false, text: result.error }
      )
    })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => send(false)}>
          {pending && <Loader2 className="mr-2 animate-spin" />}
          Send me every reminder (round 1)
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => send(true)}>
          All rounds (18 emails)
        </Button>
      </div>
      {message && (
        <p className={message.ok ? 'text-[12px] text-success' : 'text-[12px] text-danger'}>
          {message.text}
        </p>
      )}
    </div>
  )
}
