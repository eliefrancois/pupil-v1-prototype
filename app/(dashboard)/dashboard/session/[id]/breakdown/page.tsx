'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SESSIONS, MENTORS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Stars from '@/components/stars'
import { ArrowLeft, SquareCheck as CheckSquare, Square, Loader as Loader2 } from 'lucide-react'

export default function BreakdownPage() {
  const params = useParams()
  const sessionId = params.id as string
  const session = SESSIONS.find((s) => s.id === sessionId)
  const mentor = session ? MENTORS.find((m) => m.id === session.mentorId) : null

  const [actionStates, setActionStates] = useState<Record<string, boolean>>(
    () => {
      if (!session?.breakdown) return {}
      return Object.fromEntries(
        session.breakdown.actionItems.map((item) => [item.id, item.done])
      )
    }
  )
  const [rating, setRating] = useState(session?.rated ?? 0)

  if (!session || !mentor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Session not found.</p>
      </div>
    )
  }

  // Processing state - no breakdown yet
  if (!session.breakdown) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-8">
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </Link>

          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#7A60E4]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Processing your session
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your breakdown will be ready in a few minutes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const breakdown = session.breakdown
  const start = new Date(session.startsAt)

  function toggleAction(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        {/* Back link */}
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>

        {/* Session header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session breakdown</h1>
          <p className="mt-1 text-sm text-gray-500">
            {start.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}{' '}
            &middot; {mentor.name} &middot; {session.duration} min
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-3">
            {/* Topics covered */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topics covered</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {breakdown.topics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A60E4]" />
                      <span className="text-sm text-gray-700">{topic}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {breakdown.actionItems.map((item) => {
                    const checked = actionStates[item.id] ?? false
                    return (
                      <li key={item.id} className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAction(item.id)}
                          className="mt-0.5 shrink-0 text-gray-400 hover:text-[#7A60E4]"
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4 text-[#7A60E4]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <span
                          className={`text-sm ${
                            checked
                              ? 'text-gray-400 line-through'
                              : 'text-gray-700'
                          }`}
                        >
                          {item.text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>

            {/* Next session focus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next session focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-700">
                  {breakdown.nextFocus}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Mentioned entities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mentioned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {breakdown.mentioned.map((entity) => (
                    <Badge key={entity} variant="secondary">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rate session */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rate this session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-3 py-2">
                  <Stars
                    value={rating}
                    size={28}
                    interactive
                    onChange={setRating}
                  />
                  <p className="text-xs text-gray-400">
                    {rating > 0
                      ? `You rated this session ${rating} star${rating !== 1 ? 's' : ''}`
                      : 'Click to rate'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
