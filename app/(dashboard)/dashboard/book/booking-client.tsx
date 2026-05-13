'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { ArrowLeft, Calendar, CheckCircle2, Settings } from 'lucide-react'
import { addDays, startOfWeek } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDayHeaderET, formatSlotTimeOnly } from '@/lib/scheduling/slots'

import { bookSession } from './actions'

type ClientSlot = { startsAtIso: string; day: number; slot: number }

interface BookingClientProps {
  mentorId: string
  mentorName: string
  mentorUniversity: string
  mentorTimezone: string | null
  sessionsRemaining: number
  sessionsTotal: number
  mentorIsActive: boolean
  mentorHasSlots: boolean
  studentNeedsAvailability: boolean
  openSlots: ClientSlot[]
}

export default function BookingClient({
  mentorId,
  mentorName,
  mentorUniversity,
  sessionsRemaining,
  sessionsTotal,
  mentorIsActive,
  mentorHasSlots,
  studentNeedsAvailability,
  openSlots,
}: BookingClientProps) {
  const router = useRouter()
  const [pendingSlot, setPendingSlot] = useState<ClientSlot | null>(null)
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [viewerTz, setViewerTz] = useState<string | undefined>(undefined)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
      } catch {
        setViewerTz(undefined)
      }
    }
  }, [])

  const groupedByWeek = useMemo(() => {
    if (openSlots.length === 0) return [] as { weekLabel: string; days: { dateLabel: string; slots: ClientSlot[] }[] }[]

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weeks: {
      weekLabel: string
      start: Date
      end: Date
      days: { dateLabel: string; slots: ClientSlot[] }[]
    }[] = []

    for (let w = 0; w < 4; w++) {
      const start = addDays(weekStart, w * 7)
      const end = addDays(start, 7)
      weeks.push({
        weekLabel:
          w === 0
            ? 'This week'
            : w === 1
              ? 'Next week'
              : `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start,
        end,
        days: [],
      })
    }

    for (const slot of openSlots) {
      const ts = new Date(slot.startsAtIso).getTime()
      const idx = weeks.findIndex(
        (w) => ts >= w.start.getTime() && ts < w.end.getTime()
      )
      if (idx < 0) continue
      const dayLabel = formatDayHeaderET(new Date(slot.startsAtIso))
      const dayBucket = weeks[idx].days.find((d) => d.dateLabel === dayLabel)
      if (dayBucket) {
        dayBucket.slots.push(slot)
      } else {
        weeks[idx].days.push({ dateLabel: dayLabel, slots: [slot] })
      }
    }

    return weeks.map((w) => ({ weekLabel: w.weekLabel, days: w.days }))
  }, [openSlots])

  const activeWeek = groupedByWeek[weekOffset]
  const hasAnySlotsAcrossWeeks = openSlots.length > 0

  function handleConfirm() {
    if (!pendingSlot) return
    setError(null)
    startTransition(async () => {
      const result = await bookSession({
        mentorId,
        startsAtIso: pendingSlot.startsAtIso,
      })
      if (result.ok) {
        setConfirmedBookingId(result.bookingId)
        setPendingSlot(null)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="display text-[28px] leading-tight">Book a session</h1>
            <p className="mt-1 text-[14px] text-text-2">
              With {mentorName} ({mentorUniversity})
            </p>
          </div>
          <Badge variant="secondary">
            {sessionsRemaining} of {sessionsTotal} sessions left
          </Badge>
        </div>

        {!mentorIsActive && (
          <Card className="bg-surface-2 border-line">
            <CardContent className="p-6 text-[14px] text-text-2">
              Your mentor isn&apos;t accepting bookings right now. We&apos;ll
              email you as soon as that changes.
            </CardContent>
          </Card>
        )}

        {mentorIsActive && !mentorHasSlots && (
          <Card className="bg-surface-2 border-line">
            <CardContent className="p-6 text-[14px] text-text-2">
              Your mentor hasn&apos;t set their availability yet. We&apos;ve
              nudged them. You&apos;ll be able to book here as soon as they
              do.
            </CardContent>
          </Card>
        )}

        {mentorIsActive && mentorHasSlots && studentNeedsAvailability && (
          <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10 text-warning">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    Set your availability to book
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-2">
                    Tell us when you can usually meet. We&apos;ll only show
                    slots that overlap with {mentorName}&apos;s availability.
                  </p>
                </div>
              </div>
              <Button asChild className="sm:shrink-0">
                <Link href="/dashboard/schedule">Set availability</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {mentorIsActive && mentorHasSlots && !studentNeedsAvailability && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-surface px-4 py-3">
              <p className="text-[13px] text-text-2">
                Sessions are 30 minutes. Times shown in US Eastern; tap to see
                your local time.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/schedule">
                  <Settings className="h-3.5 w-3.5" />
                  Edit my availability
                </Link>
              </Button>
            </div>

            <div className="flex gap-1 rounded-[var(--radius)] border border-line bg-surface-2 p-1">
              {groupedByWeek.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWeekOffset(i)}
                  className={`flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    i === weekOffset
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-2 hover:text-text'
                  }`}
                >
                  {w.weekLabel}
                </button>
              ))}
            </div>

            {hasAnySlotsAcrossWeeks ? (
              activeWeek && activeWeek.days.length > 0 ? (
                <div className="space-y-4">
                  {activeWeek.days.map((day) => (
                    <Card key={day.dateLabel}>
                      <CardContent className="space-y-3 p-5">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
                          {day.dateLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {day.slots.map((s) => (
                            <button
                              key={s.startsAtIso}
                              type="button"
                              onClick={() => setPendingSlot(s)}
                              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-[13px] font-medium text-text transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                            >
                              {formatSlotTimeOnly(
                                new Date(s.startsAtIso),
                                viewerTz
                              )}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-[14px] text-text-2">
                    No open slots this week. Try another week.
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                  <Calendar className="h-10 w-10 text-text-3" />
                  <p className="text-[14px] font-medium text-text">
                    No overlapping availability
                  </p>
                  <p className="max-w-md text-[13px] text-text-2">
                    None of your slots overlap with your mentor&apos;s. Add
                    more times to your availability so we can find a match.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/dashboard/schedule">
                      Edit my availability
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={pendingSlot !== null && confirmedBookingId === null}
        onOpenChange={(open) => {
          if (!open) setPendingSlot(null)
        }}
      >
        <DialogContent
          onClose={() => {
            if (!pending) {
              setPendingSlot(null)
              setError(null)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Book this session?</DialogTitle>
            <DialogDescription>
              {pendingSlot && (
                <>
                  <span className="block text-text">
                    {formatDayHeaderET(new Date(pendingSlot.startsAtIso))} at{' '}
                    {formatSlotTimeOnly(
                      new Date(pendingSlot.startsAtIso),
                      viewerTz
                    )}
                  </span>
                  <span className="mt-1 block">
                    30 minutes with {mentorName}. Uses 1 of your{' '}
                    {sessionsRemaining} remaining sessions.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!pending) {
                  setPendingSlot(null)
                  setError(null)
                }
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? 'Booking...' : 'Confirm booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog
        open={confirmedBookingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmedBookingId(null)
            router.refresh()
          }
        }}
      >
        <DialogContent
          onClose={() => {
            setConfirmedBookingId(null)
            router.refresh()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              You&apos;re booked
            </DialogTitle>
            <DialogDescription>
              We&apos;ve sent a calendar invite to your email. The session
              will show up on your dashboard with a join button when it&apos;s
              time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link href="/dashboard/history">View history</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
