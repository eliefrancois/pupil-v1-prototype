import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Calendar } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMentorSessions } from '@/lib/supabase/queries'

export default async function MentorHistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mentor/history')

  const allSessions = await getMentorSessions(user.id)
  const pastSessions = allSessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled',
  )
  const completedCount = pastSessions.filter(
    (s) => s.status === 'completed',
  ).length
  const cancelledCount = pastSessions.filter(
    (s) => s.status === 'cancelled',
  ).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session history</h1>
          <p className="mt-1 text-sm text-gray-500">
            {completedCount} completed &middot; {cancelledCount} cancelled
          </p>
        </div>

        {pastSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="flex flex-col items-center p-0">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-semibold text-text">
                No past sessions yet
              </p>
              <p className="mt-1 max-w-xs text-[13px] text-text-2">
                Sessions you complete with mentees will show up here with the
                recording and transcript.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session) => {
              const start = new Date(session.starts_at)
              const isCompleted = session.status === 'completed'
              const isCancelled = session.status === 'cancelled'
              const studentName = session.student?.full_name ?? 'Student'

              const cardBody = (
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar alt={studentName} size="default" />
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
                      {session.duration} min &middot; {studentName}
                    </p>
                  </div>
                  {isCompleted && <Badge variant="success">Completed</Badge>}
                  {isCancelled && <Badge variant="danger">Cancelled</Badge>}
                  {isCompleted ? (
                    <ArrowRight className="h-4 w-4 text-text-3" />
                  ) : null}
                </CardContent>
              )

              return isCompleted ? (
                <Link
                  key={session.id}
                  href={`/mentor/session/${session.id}/breakdown`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-surface-2">
                    {cardBody}
                  </Card>
                </Link>
              ) : (
                <Card key={session.id}>{cardBody}</Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
