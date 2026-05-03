'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STUDENT, MENTORS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9am to 8pm
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateRange(start: Date): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
}

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

/** Deterministic pseudo-random availability based on date + hour seed */
function isAvailable(day: Date, hour: number): boolean {
  const seed = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()
  const hash = ((seed * 31 + hour * 17) ^ 0x5f3759df) >>> 0
  const dayOfWeek = day.getDay()
  // No availability on Sundays
  if (dayOfWeek === 0) return false
  // Past dates are not available
  const now = new Date()
  const slotTime = new Date(day)
  slotTime.setHours(hour, 0, 0, 0)
  if (slotTime < now) return false
  // Deterministic pattern: ~40% of remaining slots available
  return hash % 5 < 2
}

export default function BookingPage() {
  const mentor = MENTORS.find((m) => m.id === STUDENT.matchedMentor)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const today = useMemo(() => new Date(), [])
  const thisWeekStart = useMemo(() => getWeekStart(today), [today])

  const currentWeekStart = useMemo(() => {
    const d = new Date(thisWeekStart)
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [thisWeekStart, weekOffset])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentWeekStart])

  function handleSlotClick(day: Date, hour: number) {
    setSelectedSlot({ date: day, hour })
    setConfirmed(false)
    setDialogOpen(true)
  }

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => {
      setDialogOpen(false)
    }, 1500)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a session</h1>
          <p className="mt-1 text-gray-500">
            with {mentor?.name ?? 'your mentor'} &middot;{' '}
            {STUDENT.sessionsRemaining} sessions remaining
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
            disabled={weekOffset <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700">
            {formatDateRange(currentWeekStart)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 4}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              This week
            </Button>
          )}
        </div>

        {/* Calendar grid */}
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100">
                <div />
                {weekDays.map((day, i) => {
                  const isToday =
                    day.toDateString() === today.toDateString()
                  return (
                    <div
                      key={i}
                      className="border-l border-gray-100 px-2 py-3 text-center"
                    >
                      <p className="text-xs font-medium text-gray-400">
                        {DAY_LABELS[day.getDay()]}
                      </p>
                      <p
                        className={`mt-0.5 text-sm font-semibold ${
                          isToday ? 'text-[#7A60E4]' : 'text-gray-900'
                        }`}
                      >
                        {day.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-50"
                >
                  <div className="flex items-center justify-end pr-3 text-xs text-gray-400">
                    {formatHour(hour)}
                  </div>
                  {weekDays.map((day, i) => {
                    const available = isAvailable(day, hour)
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-center border-l border-gray-50 p-1"
                        style={{ minHeight: 44 }}
                      >
                        {available ? (
                          <button
                            type="button"
                            onClick={() => handleSlotClick(day, hour)}
                            className="h-full w-full rounded-md bg-[#7A60E4]/10 px-1 py-1.5 text-xs font-medium text-[#7A60E4] transition-colors hover:bg-[#7A60E4]/20"
                          >
                            {formatHour(hour)}
                          </button>
                        ) : (
                          <div className="h-full w-full rounded-md bg-gray-50" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent onClose={() => setDialogOpen(false)}>
            {confirmed ? (
              <div className="flex flex-col items-center py-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Session booked!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  You&apos;ll receive a reminder before the call.
                </p>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm booking</DialogTitle>
                  <DialogDescription>
                    Review the details below and confirm.
                  </DialogDescription>
                </DialogHeader>
                {selectedSlot && (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-900">
                        {selectedSlot.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium text-gray-900">
                        {formatHour(selectedSlot.hour)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">
                        30 minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Mentor</span>
                      <span className="font-medium text-gray-900">
                        {mentor?.name}
                      </span>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm}>Confirm booking</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
