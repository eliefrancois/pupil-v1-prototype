'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CanonicalSlotGrid from '@/components/scheduling/canonical-slot-grid'

import { saveStudentAvailability } from '@/app/(dashboard)/dashboard/book/actions'

interface AvailabilityPromptProps {
  open: boolean
  onSaved: () => void
  initialSlotIds?: string[]
}

export default function AvailabilityPrompt({
  open,
  onSaved,
  initialSlotIds = [],
}: AvailabilityPromptProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSlotIds)
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveStudentAvailability(Array.from(selected))
      if (result.ok) {
        onSaved()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick the times you can usually meet</DialogTitle>
          <DialogDescription>
            Sessions happen at fixed weekly times. Select the slots that
            work for you so we only show you ones your mentor can also make.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-2 max-h-[60vh] overflow-y-auto px-2">
          <CanonicalSlotGrid value={selected} onChange={setSelected} />
        </div>

        {error && (
          <p className="text-[13px] text-danger">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-text-3">
            {selected.size} slot{selected.size === 1 ? '' : 's'} selected
          </p>
          <Button
            onClick={handleSave}
            disabled={pending || selected.size === 0}
          >
            {pending ? 'Saving...' : 'Save & continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
