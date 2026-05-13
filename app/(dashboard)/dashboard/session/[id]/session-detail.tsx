'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Video,
  XCircle,
} from 'lucide-react'

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
import { CANCEL_REFUND_HOURS } from '@/lib/scheduling/canonical-slots'
import { computeJoinWindow } from '@/lib/scheduling/join-window'
import { formatSlot, formatSlotTimeOnly } from '@/lib/scheduling/slots'
import { cancelBooking } from '@/lib/actions/booking-actions'
import { joinSession } from '@/lib/actions/call-actions'
import CallRoom from '@/components/scheduling/call-room'
import type { BookingDetail } from '@/lib/supabase/queries'

interface SessionDetailProps {
  booking: BookingDetail
  backHref: string
}

export default function SessionDetail({ booking, backHref }: SessionDetailProps) {
  const router = useRouter()
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [viewerTz, setViewerTz] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [joinPending, setJoinPending] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [callContext, setCallContext] = useState<{
    roomUrl: string
    token: string
    userName: string
  } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
      } catch {
        setViewerTz(undefined)
      }
    }
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const startsAt = useMemo(() => new Date(booking.starts_at), [booking.starts_at])
  const hoursUntil = (startsAt.getTime() - now) / (1000 * 60 * 60)
  const isUpcoming = booking.status === 'upcoming'
  const joinWindow = useMemo(
    () => computeJoinWindow(startsAt, booking.duration ?? 30, new Date(now)),
    [startsAt, booking.duration, now]
  )
  const isJoinable = isUpcoming && joinWindow.isOpen
  const willRefund = hoursUntil >= CANCEL_REFUND_HOURS

  const counterpartLabel = booking.counterpart?.full_name ?? 'your match'

  function handleJoin() {
    setJoinError(null)
    setJoinPending(true)
    void (async () => {
      const result = await joinSession(booking.id)
      setJoinPending(false)
      if (result.ok) {
        setCallContext({
          roomUrl: result.roomUrl,
          token: result.token,
          userName: counterpartLabel,
        })
      } else {
        setJoinError(result.error)
      }
    })()
  }

  function handleLeave() {
    setCallContext(null)
    router.refresh()
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelBooking({
        bookingId: booking.id,
        reason: reason.trim() || undefined,
      })
      if (result.ok) {
        setShowCancel(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  if (callContext) {
    // While in-call we break out of the parent's max-w-3xl + padding and take
    // over the full content area. Daily's fullscreen button is still wired
    // up (showFullscreenButton: true) for users who want true fullscreen.
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-bg p-4 md:p-6">
        <div className="mb-3 flex-shrink-0">
          <h1 className="display text-[20px] leading-tight md:text-[24px]">
            In session with {counterpartLabel}
          </h1>
          <p className="text-[12px] text-text-2 md:text-[13px]">
            This call is being recorded and transcribed for safety.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <CallRoom
            roomUrl={callContext.roomUrl}
            token={callContext.token}
            userName={callContext.userName}
            onLeave={handleLeave}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="display text-[28px] leading-tight">
          {booking.status === 'cancelled'
            ? 'Cancelled session'
            : booking.status === 'completed'
              ? 'Past session'
              : 'Upcoming session'}
        </h1>
        <p className="text-[14px] text-text-2">
          With {counterpartLabel}
          {booking.counterpart?.university
            ? ` (${booking.counterpart.university})`
            : ''}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[15px] font-semibold text-text">
                {formatSlot(startsAt, viewerTz)}
              </p>
              <p className="text-[13px] text-text-2">
                {booking.duration} min &middot; {counterpartLabel}
              </p>
              <p className="text-[12px] text-text-3">
                Your local time:{' '}
                {formatSlotTimeOnly(startsAt, viewerTz)}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {isUpcoming && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleJoin}
                  disabled={!isJoinable || joinPending}
                >
                  <Video className="h-4 w-4" />
                  {joinPending
                    ? 'Connecting...'
                    : isJoinable
                      ? 'Join session'
                      : 'Join opens 5 min before'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  disabled={pending}
                >
                  Cancel session
                </Button>
              </div>
              {joinError && (
                <p className="text-[13px] text-danger">{joinError}</p>
              )}
            </div>
          )}

          {booking.status === 'cancelled' && booking.cancel_reason && (
            <div className="rounded-[var(--radius-sm)] bg-surface-2 p-3 text-[13px] text-text-2">
              <span className="font-medium text-text">Reason:</span>{' '}
              {booking.cancel_reason}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-[13px] text-text-2">
          <p className="font-medium text-text">What to expect</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-3.5 w-3.5 text-text-3" />
              30 minutes, on Pupil&apos;s built-in video.
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 text-text-3" />
              Join button opens 5 minutes before start time.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-text-3" />
              Recording and transcript are saved for safety; you&apos;ll get a
              short post-call breakdown.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent
          onClose={() => {
            if (!pending) {
              setShowCancel(false)
              setError(null)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Cancel this session?</DialogTitle>
            <DialogDescription>
              {willRefund ? (
                <>
                  You&apos;re cancelling more than{' '}
                  {CANCEL_REFUND_HOURS} hours out, so your session credit will
                  be returned. {counterpartLabel} will be notified.
                </>
              ) : (
                <>
                  Cancelling within {CANCEL_REFUND_HOURS} hours uses your
                  session credit. {counterpartLabel} will be notified.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="cancel-reason"
              className="text-[13px] font-medium text-text"
            >
              Reason (optional)
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-3 focus:border-primary focus:outline-none"
              placeholder="What happened?"
            />
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!pending) {
                  setShowCancel(false)
                  setError(null)
                }
              }}
              disabled={pending}
            >
              Keep session
            </Button>
            <Button
              variant={willRefund ? 'default' : 'outline'}
              onClick={handleCancel}
              disabled={pending}
            >
              {pending ? 'Cancelling...' : 'Cancel session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <Link
          href={backHref}
          className="text-[13px] text-text-2 hover:text-primary"
        >
          Back
        </Link>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <Badge variant="danger">
        <XCircle className="h-3 w-3" />
        Cancelled
      </Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </Badge>
    )
  }
  if (status === 'no_show') {
    return <Badge variant="secondary">No show</Badge>
  }
  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      Upcoming
    </Badge>
  )
}
