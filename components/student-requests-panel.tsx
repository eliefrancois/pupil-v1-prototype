import Link from 'next/link'
import { Clock, Inbox, Send, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

import CancelRequestButton from './cancel-request-button'

interface StudentRequestsPanelProps {
  studentId: string
}

/**
 * Server component listing a student's pending/forwarded match requests on
 * their dashboard. Renders nothing if the student has no active requests.
 *
 * Recently-decided requests fall off after the student sees them once;
 * we surface up to 5 active (pending|forwarded) requests sorted newest-first.
 */
export default async function StudentRequestsPanel({
  studentId,
}: StudentRequestsPanelProps) {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('match_requests')
    .select(
      `id, status, requested_at,
       mentor:users!match_requests_mentor_id_fkey(id, full_name)`
    )
    .eq('student_id', studentId)
    .in('status', ['pending', 'forwarded'])
    .order('requested_at', { ascending: false })
    .limit(5)

  type Row = {
    id: string
    status: string
    requested_at: string
    mentor: { id: string; full_name: string }
  }
  const requests: Row[] = (rows as Row[] | null) ?? []
  if (requests.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light text-primary">
              <Inbox className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
              Your match requests
            </h3>
          </div>
          <Link
            href="/mentors"
            className="text-[12px] text-text-2 transition-colors hover:text-primary"
          >
            Browse more
          </Link>
        </div>

        <ul className="divide-y divide-line">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-text">
                  <Link
                    href={`/mentors/${r.mentor.id}`}
                    className="transition-colors hover:text-primary"
                  >
                    {r.mentor.full_name}
                  </Link>
                </p>
                <p className="text-[11px] text-text-3">
                  Requested {timeAgo(r.requested_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RequestStatusBadge status={r.status} />
                <CancelRequestButton requestId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function RequestStatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <Badge variant="warning">
        <Clock className="mr-1 h-3 w-3" />
        Awaiting review
      </Badge>
    )
  }
  if (status === 'forwarded') {
    return (
      <Badge variant="secondary">
        <Send className="mr-1 h-3 w-3" />
        Sent to mentor
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <Sparkles className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
