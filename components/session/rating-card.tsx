'use client'

import { useState, useTransition } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Stars from '@/components/stars'
import { submitRating } from '@/lib/actions/rating-actions'

interface RatingCardProps {
  bookingId: string
  initialScore: number | null
}

/**
 * Student-only rating widget. Optimistic on the stars (snappy feel), reverts
 * on server failure. Persists across page refreshes via the `existingRating`
 * preloaded by the page query.
 */
export function RatingCard({ bookingId, initialScore }: RatingCardProps) {
  const [score, setScore] = useState<number>(initialScore ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(
    initialScore !== null ? Date.now() : null,
  )
  const [isPending, startTransition] = useTransition()

  const handleChange = (next: number) => {
    const prev = score
    setScore(next)
    setError(null)
    startTransition(async () => {
      const result = await submitRating({ bookingId, score: next })
      if (!result.ok) {
        setScore(prev)
        setError(result.error)
        return
      }
      setSavedAt(Date.now())
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rate this session</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-2">
          <Stars value={score} size={28} interactive onChange={handleChange} />
          <p className="text-xs text-text-3">
            {error
              ? error
              : isPending
                ? 'Saving…'
                : score > 0
                  ? savedAt
                    ? `Rated ${score} star${score !== 1 ? 's' : ''}`
                    : `${score} star${score !== 1 ? 's' : ''}`
                  : 'Click a star to rate'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
