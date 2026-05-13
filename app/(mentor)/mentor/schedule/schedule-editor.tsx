'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CanonicalSlotGrid from '@/components/scheduling/canonical-slot-grid'

import { saveMentorAvailability } from './actions'

interface ScheduleEditorProps {
  initialSlotIds: string[]
  isApproved: boolean
}

export default function ScheduleEditor({
  initialSlotIds,
  isApproved,
}: ScheduleEditorProps) {
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

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveMentorAvailability(Array.from(selected))
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
            Pick the times you can usually meet. Students you&apos;re matched
            with only see slots you&apos;ve opted into.
          </p>
        </div>

        {!isApproved && (
          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex items-start gap-3 p-4 text-[13px] text-text-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Your account isn&apos;t fully active yet, but you can set your
                availability now so you&apos;re ready as soon as you&apos;re
                approved.
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
          <p className="text-[13px] text-text-3">
            {selected.size} slot{selected.size === 1 ? '' : 's'} selected
            {savedAt && !isDirty && (
              <span className="ml-3 inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </p>
          <Button
            onClick={handleSave}
            disabled={pending || !isDirty}
          >
            {pending ? 'Saving...' : 'Save availability'}
          </Button>
        </div>
      </div>
    </div>
  )
}
