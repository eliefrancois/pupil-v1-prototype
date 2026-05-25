import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { getMentorStatsBatch } from '@/lib/supabase/queries'

import MentorReviewRow from './mentor-row'
import type { MentorReviewItem } from './types'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pending review' },
  { id: 'approved', label: 'Approved' },
  { id: 'paused', label: 'Paused' },
  { id: 'rejected', label: 'Rejected' },
] as const

const PAGE_SIZE = 50

const MENTOR_LIST_SELECT =
  'user_id, university, major, grad_year, year_in_school, bio, photo_url, linkedin_url, tags, max_mentees, active_mentees_count, sessions_count, rating, status, submitted_at, reviewed_at, reviewed_by, review_notes, motivations, identity_json, commitment, timezone, availability_schedule'

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/mentors')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">Admins only</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeStatus = STATUS_FILTERS.find((f) => f.id === searchParams.status)
    ? (searchParams.status as (typeof STATUS_FILTERS)[number]['id'])
    : 'pending'

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createClient()

  const [
    pendingCountRes,
    approvedCountRes,
    pausedCountRes,
    rejectedCountRes,
    profilesRes,
  ] = await Promise.all([
    supabase
      .from('mentor_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('mentor_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('mentor_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'paused'),
    supabase
      .from('mentor_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase
      .from('mentor_profiles')
      .select(MENTOR_LIST_SELECT, { count: 'exact' })
      .eq('status', activeStatus)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  ])

  if (profilesRes.error) {
    console.error('[admin/mentors] failed to load profiles', profilesRes.error)
  }

  const counts = {
    pending: pendingCountRes.count ?? 0,
    approved: approvedCountRes.count ?? 0,
    paused: pausedCountRes.count ?? 0,
    rejected: rejectedCountRes.count ?? 0,
  }

  const totalForTab = profilesRes.count ?? counts[activeStatus]
  const totalPages = Math.max(1, Math.ceil(totalForTab / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const profileRows = profilesRes.data ?? []
  const mentorIds = profileRows.map((row) => row.user_id)

  const [usersRes, liveStats] = await Promise.all([
    mentorIds.length > 0
      ? supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', mentorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    activeStatus === 'approved' || activeStatus === 'paused'
      ? getMentorStatsBatch(supabase, mentorIds)
      : Promise.resolve(new Map()),
  ])

  const userById = new Map(
    (usersRes.data ?? []).map((u) => [u.id, u as { id: string; full_name: string; email: string }])
  )

  const mentors: MentorReviewItem[] = profileRows.map((row) => {
    const u = userById.get(row.user_id)
    const stats = liveStats.get(row.user_id)
    return {
      ...row,
      full_name: u?.full_name ?? '',
      email: u?.email ?? '',
      active_mentees_count: stats?.activeMentees ?? 0,
      sessions_count: stats?.sessionsCount ?? 0,
      rating: stats && stats.sessionsCount > 0 ? stats.rating : null,
    } as MentorReviewItem
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">Mentors</h1>
          <p className="mt-1 text-[14px] text-text-2">
            {counts.pending} pending · {counts.approved} approved ·{' '}
            {counts.paused} paused · {counts.rejected} rejected
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeStatus === filter.id
            const count = counts[filter.id]
            return (
              <a
                key={filter.id}
                href={`/admin/mentors?status=${filter.id}`}
                className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-text-2 hover:bg-surface-2 hover:text-text'
                }`}
              >
                {filter.label}
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    isActive ? 'bg-white text-primary' : 'bg-surface-2 text-text-3'
                  }`}
                >
                  {count}
                </span>
              </a>
            )
          })}
        </div>

        {mentors.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <p className="text-[15px] font-semibold text-text">
                {activeStatus === 'pending'
                  ? 'Nothing to review'
                  : `No ${activeStatus} mentors`}
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                {activeStatus === 'pending'
                  ? 'New mentor applications will show up here.'
                  : 'Switch tabs to see other mentors.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {totalForTab > PAGE_SIZE && (
              <p className="text-[12px] text-text-3">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, totalForTab)} of {totalForTab}{' '}
                {activeStatus} mentors
              </p>
            )}
            <div className="space-y-3">
              {mentors.map((mentor) => (
                <MentorReviewRow key={mentor.user_id} mentor={mentor} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[12px] text-text-3">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/mentors?status=${activeStatus}&page=${safePage - 1}`}
                      >
                        Previous
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                  )}
                  {safePage < totalPages ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/mentors?status=${activeStatus}&page=${safePage + 1}`}
                      >
                        Next
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeStatus === 'pending' && mentors.length > 0 && (
          <div className="rounded-[var(--radius-sm)] bg-surface-2 p-4 text-[12px] text-text-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Tip</Badge>
              <span>
                Approving a mentor flips their profile to public on{' '}
                <code>/mentors</code> and unlocks the mentor dashboard. Rejection
                sends them an email with optional notes.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
