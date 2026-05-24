'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Lock, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Stars from '@/components/stars'
import { submitRating } from '@/lib/actions/rating-actions'

interface RatingCardProps {
  bookingId: string
  /** Existing score from the DB (null if not rated yet). */
  initialScore: number | null
  /** True if the 24h rating window is still open. */
  windowOpen: boolean
  /** When the rating window closes (ISO). Shown in the open state. */
  windowClosesAt: string
  /** Called once a rating is successfully submitted (for parents that gate UI). */
  onSubmitted?: () => void
}

/**
 * Student-only rating widget.
 *
 * Three states:
 *  - `initialScore !== null`     → locked (already submitted, no edits)
 *  - `!windowOpen`               → closed (can't submit anymore)
 *  - otherwise                   → open (pick stars, confirm with submit)
 *
 * Ratings are permanent once submitted, so we require an explicit submit
 * click rather than auto-saving on each star tap.
 */
export function RatingCard({
  bookingId,
  initialScore,
  windowOpen,
  windowClosesAt,
  onSubmitted,
}: RatingCardProps) {
  const [score, setScore] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const locked = initialScore !== null || justSubmitted
  const lockedScore = (initialScore ?? (justSubmitted ? score : 0)) || 0

  if (locked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Rating submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-2">
            <Stars value={lockedScore} size={28} />
            <p className="inline-flex items-center gap-1.5 text-xs text-text-3">
              <Lock className="h-3 w-3" />
              {lockedScore} star{lockedScore !== 1 ? 's' : ''} \u00b7 ratings can\u2019t be changed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!windowOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate this session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <Clock className="h-5 w-5 text-text-3" />
            <p className="text-[13px] text-text-2">
              The rating window for this session has closed.
            </p>
            <p className="text-[12px] text-text-3">
              You have 24 hours after each session to submit a rating.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const closesLabel = new Date(windowClosesAt).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleSubmit = () => {
    if (score < 1) return
    setError(null)
    startTransition(async () => {
      const result = await submitRating({ bookingId, score })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setJustSubmitted(true)
      onSubmitted?.()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rate this session</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-2">
          <Stars value={score} size={32} interactive onChange={setScore} />
          <p className="text-center text-[12px] text-text-3">
            {score > 0
              ? `${score} star${score !== 1 ? 's' : ''} \u00b7 ratings are final once submitted`
              : `Tap a star to rate. Closes ${closesLabel}.`}
          </p>
          {error && (
            <p className="text-center text-[12px] text-danger">{error}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={score < 1 || isPending}
            className="w-full"
          >
            {isPending ? 'Submitting\u2026' : 'Submit rating'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
