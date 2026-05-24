import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: { status?: string }
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

  const supabase = createClient()
  const [profilesRes, usersRes] = await Promise.all([
    supabase
      .from('mentor_profiles')
      .select(
        'user_id, university, major, grad_year, year_in_school, bio, photo_url, linkedin_url, tags, max_mentees, active_mentees_count, sessions_count, rating, status, submitted_at, reviewed_at, reviewed_by, review_notes, motivations, identity_json, commitment, timezone, availability_schedule'
      )
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, full_name, email').eq('role', 'mentor'),
  ])

  const userById = new Map(
    (usersRes.data ?? []).map((u) => [u.id, u as { id: string; full_name: string; email: string }])
  )

  // Override the stale denormalized stat columns with live counts.
  const mentorIds = (profilesRes.data ?? []).map((row) => row.user_id)
  const liveStats = await getMentorStatsBatch(supabase, mentorIds)

  const allMentors: MentorReviewItem[] = (profilesRes.data ?? []).map((row) => {
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

  const counts = {
    pending: allMentors.filter((m) => m.status === 'pending').length,
    approved: allMentors.filter((m) => m.status === 'approved').length,
    paused: allMentors.filter((m) => m.status === 'paused').length,
    rejected: allMentors.filter((m) => m.status === 'rejected').length,
  }

  const filtered = allMentors.filter((m) => m.status === activeStatus)

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

        {filtered.length === 0 ? (
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
          <div className="space-y-3">
            {filtered.map((mentor) => (
              <MentorReviewRow key={mentor.user_id} mentor={mentor} />
            ))}
          </div>
        )}

        {activeStatus === 'pending' && filtered.length > 0 && (
          <div className="rounded-[var(--radius-sm)] bg-surface-2 p-4 text-[12px] text-text-2">
            <p>
              <Badge variant="warning">Tip</Badge> Approving a mentor flips
              their profile to public on <code>/mentors</code> and unlocks the
              mentor dashboard. Rejection sends them an email with optional
              notes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
