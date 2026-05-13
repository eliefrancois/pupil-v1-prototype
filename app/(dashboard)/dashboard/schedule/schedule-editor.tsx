'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CanonicalSlotGrid from '@/components/scheduling/canonical-slot-grid'
import {
  MIN_QUEUE_SLOTS,
  isMatchQueueEligible,
} from '@/lib/scheduling/canonical-slots'

import { saveStudentAvailability } from '../book/actions'

interface StudentScheduleEditorProps {
  initialSlotIds: string[]
  hasMatch: boolean
}

export default function StudentScheduleEditor({
  initialSlotIds,
  hasMatch,
}: StudentScheduleEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSlotIds)
  )
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialSet = useMemo(() => new Set(initialSlotIds), [initialSlotIds])
  const isDirty = useMemo(() => {
    if (selected.size !== initialSet.size) return true
    for (const id of selected) if (!initialSet.has(id)) return true
    return false
  }, [selected, initialSet])

  // Queue eligibility is based on what's currently saved to the DB, not the
  // pending edits in the form. If user adds 3 slots but hasn't saved, they're
  // not in the queue yet.
  const savedCount = initialSet.size
  const inQueue = isMatchQueueEligible(savedCount)
  const slotsNeeded = Math.max(0, MIN_QUEUE_SLOTS - selected.size)
  const willBeInQueue = isMatchQueueEligible(selected.size)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveStudentAvailability(Array.from(selected))
      if (result.ok) {
        setSavedAt(Date.now())
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Your weekly availability
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            Pick the times you can usually meet. We use this to match you with
            a mentor whose schedule lines up, and to show you bookable slots
            once you&apos;re paired.
          </p>
        </div>

        {!hasMatch && inQueue && (
          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex items-start gap-3 p-4 text-[13px] text-text-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                You&apos;re in the matching queue. Expected match within 24 to
                48 hours. Add more slots anytime to improve your match.
              </span>
            </CardContent>
          </Card>
        )}

        {!hasMatch && !inQueue && (
          <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
            <CardContent className="flex items-start gap-3 p-4 text-[13px] text-text-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                You&apos;re not in the matching queue yet. Pick at least{' '}
                {MIN_QUEUE_SLOTS} slots and save to enter the queue.
                {savedCount > 0 && ` You currently have ${savedCount} saved.`}
              </span>
            </CardContent>
          </Card>
        )}

        {hasMatch && (
          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex items-start gap-3 p-4 text-[13px] text-text-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                You&apos;re matched. Edits here update which times your mentor
                can see when you go to book a session.
              </span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canonical session slots</CardTitle>
          </CardHeader>
          <CardContent>
            <CanonicalSlotGrid value={selected} onChange={setSelected} />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-danger bg-[rgba(220,38,38,0.05)]">
            <CardContent className="p-4 text-[13px] text-danger">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] text-text-3">
            <p>
              {selected.size} slot{selected.size === 1 ? '' : 's'} selected
              {!willBeInQueue && (
                <span className="ml-2 text-warning">
                  ({slotsNeeded} more to enter queue)
                </span>
              )}
              {savedAt && !isDirty && (
                <span className="ml-3 inline-flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleSave} disabled={pending || !isDirty}>
            {pending ? 'Saving...' : 'Save availability'}
          </Button>
        </div>
      </div>
    </div>
  )
}
