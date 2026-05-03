'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SESSIONS, MENTORS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Video,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
} from 'lucide-react'

export default function PreCallPage() {
  const params = useParams()
  const sessionId = params.id as string
  const session = SESSIONS.find((s) => s.id === sessionId)
  const mentor = session ? MENTORS.find((m) => m.id === session.mentorId) : null

  const [tipsOpen, setTipsOpen] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!session || !mentor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Session not found.</p>
      </div>
    )
  }

  const start = new Date(session.startsAt)
  const diffMs = start.getTime() - now.getTime()
  const withinFiveMin = diffMs <= 5 * 60 * 1000
  const isPast = diffMs <= 0

  const countdownText = useMemo(() => {
    if (isPast) return 'Session has started'
    const totalSec = Math.floor(diffMs / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`
    return `${mins}m ${secs}s`
  }, [diffMs, isPast])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Session header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {start.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  &middot; {session.duration} min &middot; {mentor.name}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {countdownText}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Icebreakers */}
        {session.icebreakers && session.icebreakers.length > 0 && (
          <Card className="border-l-4 border-l-[#7A60E4]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-[#7A60E4]" />
                Conversation Starters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {session.icebreakers.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7A60E4]/10 text-xs font-semibold text-[#7A60E4]">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-gray-700">{q}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Join button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-14 px-12 text-base"
            disabled={!withinFiveMin}
          >
            <Video className="mr-2 h-5 w-5" />
            {withinFiveMin ? 'Join session' : `Join in ${countdownText}`}
          </Button>
        </div>

        {/* Tips card (expandable) */}
        <Card>
          <button
            type="button"
            onClick={() => setTipsOpen(!tipsOpen)}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <span className="text-sm font-semibold text-gray-900">
              Tips for a great session
            </span>
            {tipsOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {tipsOpen && (
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A60E4]" />
                  Find a quiet place with good lighting
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A60E4]" />
                  Check your camera and microphone before joining
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A60E4]" />
                  Have your questions ready - write them down beforehand
                </li>
              </ul>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
