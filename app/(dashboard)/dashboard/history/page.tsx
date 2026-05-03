'use client'

import Link from 'next/link'
import { SESSIONS, MENTORS } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import Stars from '@/components/stars'
import { ArrowRight } from 'lucide-react'

export default function HistoryPage() {
  const pastSessions = SESSIONS.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session history</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pastSessions.length} past session{pastSessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {pastSessions.map((session) => {
            const mentor = MENTORS.find((m) => m.id === session.mentorId)
            const start = new Date(session.startsAt)
            const isCompleted = session.status === 'completed'
            const isCancelled = session.status === 'cancelled'

            return (
              <Card key={session.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <Avatar
                    src={mentor?.photo}
                    alt={mentor?.name}
                    size="default"
                  />

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
                      {session.duration} min &middot; {mentor?.name}
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
                  {session.breakdown && (
                    <Link
                      href={`/dashboard/session/${session.id}/breakdown`}
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
