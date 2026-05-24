import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Inbox } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

import RequestRow, { type RequestRowData } from './request-row'

export const dynamic = 'force-dynamic'

type StatusFilter = 'pending' | 'forwarded' | 'decided' | 'all'

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'forwarded', label: 'Forwarded' },
  { id: 'decided', label: 'Decided' },
  { id: 'all', label: 'All' },
]

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/requests')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">Admins only</p>
            <p className="mt-1 text-[13px] text-text-2">
              You need an admin role to view match requests.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status: StatusFilter =
    (TABS.find((t) => t.id === searchParams?.status)?.id as StatusFilter) ??
    'pending'

  const supabase = createClient()

  // Counts per tab (single query, group in JS so the tabs always reflect
  // the latest state without a separate count query per tab).
  const { data: countsRaw } = await supabase
    .from('match_requests')
    .select('status')
  const counts = {
    pending: 0,
    forwarded: 0,
    decided: 0,
    all: countsRaw?.length ?? 0,
  } as Record<StatusFilter, number>
  for (const row of countsRaw ?? []) {
    if (row.status === 'pending') counts.pending++
    else if (row.status === 'forwarded') counts.forwarded++
    else if (['accepted', 'declined', 'expired', 'cancelled'].includes(row.status)) {
      counts.decided++
    }
  }

  // Pull requests for the active tab. Embed student + mentor user rows so
  // we can render names/emails inline, plus the mentor's claim_status and
  // student grade for richer admin context.
  let query = supabase
    .from('match_requests')
    .select(
      `id, status, student_message, requested_at, forwarded_at, decided_at, decline_reason,
       student:users!match_requests_student_id_fkey(id, full_name, email),
       mentor:users!match_requests_mentor_id_fkey(id, full_name, email)`
    )
    .order('requested_at', { ascending: false })

  if (status === 'pending') query = query.eq('status', 'pending')
  else if (status === 'forwarded') query = query.eq('status', 'forwarded')
  else if (status === 'decided') {
    query = query.in('status', ['accepted', 'declined', 'expired', 'cancelled'])
  }

  const { data: rawRequests, error: requestsErr } = await query

  if (requestsErr) {
    console.error('[admin/requests] failed to load', requestsErr)
  }

  type RawRequest = {
    id: string
    status: string
    student_message: string | null
    requested_at: string
    forwarded_at: string | null
    decided_at: string | null
    decline_reason: string | null
    student: { id: string; full_name: string; email: string }
    mentor: { id: string; full_name: string; email: string }
  }
  const requests: RawRequest[] = (rawRequests as RawRequest[] | null) ?? []

  // Enrich with student grade + mentor claim status. Two cheap batched
  // queries (one for each profile table) keyed by id.
  const studentIds = requests.map((r) => r.student.id)
  const mentorIds = requests.map((r) => r.mentor.id)

  const [{ data: studentProfiles }, { data: mentorProfiles }] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from('student_profiles')
          .select('user_id, grade, interests, colleges')
          .in('user_id', studentIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; grade: number | null; interests: string[]; colleges: string[] }> }),
    mentorIds.length > 0
      ? supabase
          .from('mentor_profiles')
          .select('user_id, university, claim_status, claim_email_sent_at')
          .in('user_id', mentorIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; university: string; claim_status: string; claim_email_sent_at: string | null }> }),
  ])

  const studentInfo = new Map(
    (studentProfiles ?? []).map((s) => [
      s.user_id,
      {
        grade: s.grade,
        interests: s.interests ?? [],
        colleges: s.colleges ?? [],
      },
    ])
  )
  const mentorInfo = new Map(
    (mentorProfiles ?? []).map((m) => [
      m.user_id,
      {
        university: m.university,
        claim_status: m.claim_status,
        claim_email_sent_at: m.claim_email_sent_at,
      },
    ])
  )

  const rows: RequestRowData[] = requests.map((r) => ({
    id: r.id,
    status: r.status,
    studentMessage: r.student_message,
    requestedAt: r.requested_at,
    forwardedAt: r.forwarded_at,
    decidedAt: r.decided_at,
    declineReason: r.decline_reason,
    student: {
      id: r.student.id,
      name: r.student.full_name,
      email: r.student.email,
      grade: studentInfo.get(r.student.id)?.grade ?? null,
      interests: studentInfo.get(r.student.id)?.interests ?? [],
      colleges: studentInfo.get(r.student.id)?.colleges ?? [],
    },
    mentor: {
      id: r.mentor.id,
      name: r.mentor.full_name,
      email: r.mentor.email,
      university: mentorInfo.get(r.mentor.id)?.university ?? '',
      claimStatus: (mentorInfo.get(r.mentor.id)?.claim_status ?? null) as
        | 'ghost'
        | 'claimed'
        | null,
      claimEmailSentAt: mentorInfo.get(r.mentor.id)?.claim_email_sent_at ?? null,
    },
  }))

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">Match requests</h1>
          <p className="mt-1 text-[14px] text-text-2">
            Student-initiated matchmaking. Forward to claimed mentors, or
            send a claim email to ghost profiles when one gets requested.
          </p>
        </div>

        <div className="flex gap-1 rounded-[var(--radius)] border border-line bg-surface-2 p-1">
          {TABS.map((tab) => {
            const active = tab.id === status
            return (
              <Button
                key={tab.id}
                variant={active ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="flex-1"
              >
                <Link href={`/admin/requests?status=${tab.id}`}>
                  {tab.label} ({counts[tab.id]})
                </Link>
              </Button>
            )
          })}
        </div>

        {rows.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <Inbox className="mx-auto h-8 w-8 text-text-3" />
              <p className="mt-3 text-[15px] font-semibold text-text">
                Nothing here
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                {status === 'pending'
                  ? 'No new requests waiting on your review.'
                  : status === 'forwarded'
                    ? 'No requests are currently with mentors.'
                    : status === 'decided'
                      ? 'No decided requests yet.'
                      : 'No match requests have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <RequestRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
