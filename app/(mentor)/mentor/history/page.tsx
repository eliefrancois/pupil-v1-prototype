'use client'

import Link from 'next/link'
import { SESSIONS, MATCHING_QUEUE, daysFromNow } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import Stars from '@/components/stars'
import { ArrowRight } from 'lucide-react'

/* ---------- Mock mentor session history ---------- */

interface MentorSession {
  id: string
  studentName: string
  startsAt: string
  duration: number
  status: 'completed' | 'cancelled'
  rated?: number
  hasBreakdown?: boolean
}

const MENTOR_SESSIONS: MentorSession[] = [
  {
    id: 'mh_1',
    studentName: 'Riley Park',
    startsAt: daysFromNow(-7, 16, 0),
    duration: 30,
    status: 'completed',
    rated: 5,
    hasBreakdown: true,
  },
  {
    id: 'mh_2',
    studentName: 'Marcus Bell',
    startsAt: daysFromNow(-10, 17, 0),
    duration: 30,
    status: 'completed',
    rated: 4,
    hasBreakdown: true,
  },
  {
    id: 'mh_3',
    studentName: 'Riley Park',
    startsAt: daysFromNow(-21, 16, 0),
    duration: 30,
    status: 'completed',
    rated: 5,
    hasBreakdown: true,
  },
  {
    id: 'mh_4',
    studentName: 'Sofia Reyes',
    startsAt: daysFromNow(-14, 15, 0),
    duration: 30,
    status: 'completed',
    hasBreakdown: false,
  },
  {
    id: 'mh_5',
    studentName: 'Theo Bennett',
    startsAt: daysFromNow(-18, 14, 0),
    duration: 30,
    status: 'completed',
    hasBreakdown: false,
  },
  {
    id: 'mh_6',
    studentName: 'Jordan Tate',
    startsAt: daysFromNow(-28, 15, 30),
    duration: 30,
    status: 'cancelled',
  },
  {
    id: 'mh_7',
    studentName: 'Riley Park',
    startsAt: daysFromNow(-35, 16, 0),
    duration: 30,
    status: 'completed',
    rated: 4,
    hasBreakdown: true,
  },
  {
    id: 'mh_8',
    studentName: 'Anya Petrov',
    startsAt: daysFromNow(-5, 10, 0),
    duration: 30,
    status: 'completed',
    rated: 5,
    hasBreakdown: true,
  },
  {
    id: 'mh_9',
    studentName: 'Riley Park',
    startsAt: daysFromNow(-49, 16, 0),
    duration: 30,
    status: 'cancelled',
  },
]

/* ---------- Page ---------- */

export default function MentorHistoryPage() {
  const completed = MENTOR_SESSIONS.filter((s) => s.status === 'completed')
  const cancelled = MENTOR_SESSIONS.filter((s) => s.status === 'cancelled')

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session history</h1>
          <p className="mt-1 text-sm text-gray-500">
            {completed.length} completed &middot; {cancelled.length} cancelled
          </p>
        </div>

        <div className="space-y-3">
          {MENTOR_SESSIONS.map((session) => {
            const start = new Date(session.startsAt)
            const isCompleted = session.status === 'completed'
            const isCancelled = session.status === 'cancelled'

            return (
              <Card key={session.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <Avatar alt={session.studentName} size="default" />

                  {/* Date & time */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {start.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' at '}
                      {start.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.duration} min &middot; {session.studentName}
                    </p>
                  </div>

                  {/* Status badge */}
                  {isCompleted && (
                    <Badge variant="success">Completed</Badge>
                  )}
                  {isCancelled && (
                    <Badge variant="danger">Cancelled</Badge>
                  )}

                  {/* Rating */}
                  {session.rated != null && (
                    <Stars value={session.rated} size={14} />
                  )}

                  {/* Breakdown link */}
                  {session.hasBreakdown && (
                    <Link
                      href={`/mentor/session/${session.id}/breakdown`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#7A60E4] hover:underline"
                    >
                      Breakdown
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
