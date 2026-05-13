import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Calendar } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getStudentSessions } from '@/lib/supabase/queries'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/history')

  const allSessions = await getStudentSessions(user.id)
  const pastSessions = allSessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">Session history</h1>
          <p className="mt-1 text-[14px] text-text-2">
            {pastSessions.length} past session
            {pastSessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {pastSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="flex flex-col items-center p-0">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-semibold text-text">
                No sessions yet
              </p>
              <p className="mt-1 max-w-xs text-[13px] text-text-2">
                Once you complete sessions with your mentor, they&apos;ll show
                up here with notes and breakdowns.
              </p>
              <Button size="sm" className="mt-6" asChild>
                <Link href="/dashboard/book">Book your first session</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session) => {
              const start = new Date(session.starts_at)
              const isCompleted = session.status === 'completed'
              const isCancelled = session.status === 'cancelled'

              const cardBody = (
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar
                    src={session.mentor?.photo_url ?? undefined}
                    alt={session.mentor?.full_name ?? 'Mentor'}
                    size="default"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-text">
                      {start.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {start.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-[12px] text-text-2">
                      {session.duration} min · {session.mentor?.full_name}
                    </p>
                  </div>
                  {isCompleted && <Badge variant="success">Completed</Badge>}
                  {isCancelled && <Badge variant="danger">Cancelled</Badge>}
                  {isCompleted ? (
                    <ArrowRight className="h-4 w-4 text-text-3" />
                  ) : null}
                </CardContent>
              )

              // Completed sessions link to the breakdown page; cancelled
              // sessions stay as static cards (no recording/transcript to show).
              return isCompleted ? (
                <Link
                  key={session.id}
                  href={`/dashboard/session/${session.id}/breakdown`}
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
