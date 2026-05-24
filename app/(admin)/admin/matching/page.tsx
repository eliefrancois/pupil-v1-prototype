import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { normalizeOptIns } from '@/lib/scheduling/slots'
import {
  MIN_QUEUE_SLOTS,
  isMatchQueueEligible,
} from '@/lib/scheduling/canonical-slots'

import MatchRow, { type StudentPendingRequest } from './match-row'

export const dynamic = 'force-dynamic'

type StudentRow = {
  user_id: string
  full_name: string
  email: string
  matched_mentor_id: string | null
  matched_mentor_name: string | null
  grade: number | null
  city: string | null
  state: string | null
  interests: string[]
  colleges: string[]
  careers: string[]
  availability_slots: string[]
  created_at: string
  pending_requests: StudentPendingRequest[]
}

type MentorOption = {
  user_id: string
  full_name: string
  university: string
  major: string | null
  active_mentees_count: number
  max_mentees: number
  rating: number
  availability_slots: string[]
}

export default async function AdminMatchingPage({
  searchParams,
}: {
  searchParams: { show?: string }
}) {
  const tab =
    searchParams?.show === 'waiting'
      ? 'waiting'
      : searchParams?.show === 'matched'
        ? 'matched'
        : 'queue'
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/matching')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">
              Admins only
            </p>
            <p className="mt-1 text-[13px] text-text-2">
              You need an admin role to use this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = createClient()

  const [studentsRes, mentorsRes, mentorUsersRes, pendingRequestsRes] =
    await Promise.all([
    supabase
      .from('student_profiles')
      .select(
        'user_id, grade, city, state, interests, colleges, careers, matched_mentor_id, availability_slots, created_at'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('mentor_profiles')
      .select(
        'user_id, university, major, active_mentees_count, max_mentees, rating, availability_slots, status, claim_status, claim_email_sent_at'
      )
      .eq('status', 'approved'),
    supabase.from('users').select('id, full_name, email, role'),
    supabase
      .from('match_requests')
      .select('id, student_id, mentor_id, student_message, requested_at')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false }),
  ])

  if (studentsRes.error) {
    console.error('[admin/matching] failed to load student profiles', studentsRes.error)
  }
  if (mentorsRes.error) {
    console.error('[admin/matching] failed to load mentor profiles', mentorsRes.error)
  }
  if (mentorUsersRes.error) {
    console.error('[admin/matching] failed to load users', mentorUsersRes.error)
  }
  if (pendingRequestsRes.error) {
    console.error(
      '[admin/matching] failed to load match requests',
      pendingRequestsRes.error
    )
  }

  const userById = new Map(
    (mentorUsersRes.data ?? []).map((u) => [
      u.id,
      u as { id: string; full_name: string; email: string; role: string },
    ])
  )
  const mentorNameById = new Map(
    Array.from(userById.values())
      .filter((u) => u.role === 'mentor')
      .map((u) => [u.id, u.full_name])
  )
  const mentorByUserId = new Map(
    (mentorsRes.data ?? []).map((m) => [m.user_id, m])
  )

  type RawPendingRequest = {
    id: string
    student_id: string
    mentor_id: string
    student_message: string | null
    requested_at: string
  }
  const rawPending = (pendingRequestsRes.data ?? []) as RawPendingRequest[]
  const pendingMentorIds = [...new Set(rawPending.map((r) => r.mentor_id))]
  const pendingMentorProfileById = new Map<
    string,
    { claim_status: string; claim_email_sent_at: string | null }
  >()
  if (pendingMentorIds.length > 0) {
    const { data: pendingMentorProfiles } = await supabase
      .from('mentor_profiles')
      .select('user_id, claim_status, claim_email_sent_at')
      .in('user_id', pendingMentorIds)
    for (const p of pendingMentorProfiles ?? []) {
      pendingMentorProfileById.set(p.user_id, {
        claim_status: p.claim_status,
        claim_email_sent_at: p.claim_email_sent_at,
      })
    }
  }

  const pendingByStudent = new Map<string, StudentPendingRequest[]>()
  for (const row of rawPending) {
    const profile = pendingMentorProfileById.get(row.mentor_id)
    const entry: StudentPendingRequest = {
      id: row.id,
      mentor_id: row.mentor_id,
      mentor_name: mentorNameById.get(row.mentor_id) ?? 'Unknown mentor',
      student_message: row.student_message,
      requested_at: row.requested_at,
      claim_status:
        (profile?.claim_status as 'ghost' | 'claimed' | undefined) ?? null,
      claim_email_sent_at: profile?.claim_email_sent_at ?? null,
    }
    const list = pendingByStudent.get(row.student_id) ?? []
    list.push(entry)
    pendingByStudent.set(row.student_id, list)
  }

  const students: StudentRow[] = (studentsRes.data ?? [])
    .filter((row) => {
      const u = userById.get(row.user_id)
      return u?.role === 'student'
    })
    .map((row) => {
      const u = userById.get(row.user_id)
      return {
        user_id: row.user_id,
        full_name: u?.full_name ?? '',
        email: u?.email ?? '',
        matched_mentor_id: row.matched_mentor_id,
        matched_mentor_name: row.matched_mentor_id
          ? (mentorNameById.get(row.matched_mentor_id) ?? null)
          : null,
        grade: row.grade,
        city: row.city,
        state: row.state,
        interests: row.interests ?? [],
        colleges: row.colleges ?? [],
        careers: row.careers ?? [],
        availability_slots: Array.from(normalizeOptIns(row.availability_slots)),
        created_at: row.created_at,
        pending_requests: pendingByStudent.get(row.user_id) ?? [],
      }
    })

  const mentorOptions: MentorOption[] = Array.from(
    mentorByUserId.values()
  ).map((m) => ({
    user_id: m.user_id,
    full_name: mentorNameById.get(m.user_id) ?? '',
    university: m.university,
    major: m.major,
    active_mentees_count: m.active_mentees_count ?? 0,
    max_mentees: m.max_mentees ?? 3,
    rating: m.rating ?? 0,
    availability_slots: Array.from(normalizeOptIns(m.availability_slots)),
  }))

  const eligibleStudents = students.filter((s) =>
    isMatchQueueEligible(s.availability_slots.length)
  )
  const waitingStudents = students.filter(
    (s) => !isMatchQueueEligible(s.availability_slots.length)
  )
  const matchedStudents = students.filter((s) => s.matched_mentor_id)
  const queueStudents = eligibleStudents.filter((s) => !s.matched_mentor_id)
  const visibleStudents =
    tab === 'waiting'
      ? waitingStudents
      : tab === 'matched'
        ? matchedStudents
        : queueStudents

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Mentor matching
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            {queueStudents.length} need a match · {matchedStudents.length}{' '}
            matched
            {waitingStudents.length > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="text-text-3">
                  {waitingStudents.length} waiting on availability
                </span>
              </>
            )}
          </p>
        </div>

        {(queueStudents.length > 0 ||
          matchedStudents.length > 0 ||
          waitingStudents.length > 0) && (
          <div className="flex gap-1 rounded-[var(--radius)] border border-line bg-surface-2 p-1">
            <Button
              variant={tab === 'queue' ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="flex-1"
            >
              <Link href="/admin/matching">
                Needs match ({queueStudents.length})
              </Link>
            </Button>
            <Button
              variant={tab === 'matched' ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="flex-1"
            >
              <Link href="/admin/matching?show=matched">
                Matched ({matchedStudents.length})
              </Link>
            </Button>
            <Button
              variant={tab === 'waiting' ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="flex-1"
            >
              <Link href="/admin/matching?show=waiting">
                <Clock className="h-3.5 w-3.5" />
                Waiting ({waitingStudents.length})
              </Link>
            </Button>
          </div>
        )}

        {visibleStudents.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <p className="text-[15px] font-semibold text-text">
                {tab === 'waiting'
                  ? 'No students waiting on availability'
                  : tab === 'matched'
                    ? 'No matched students yet'
                    : students.length === 0
                      ? 'No students yet'
                      : 'No students need a match right now'}
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                {tab === 'waiting'
                  ? 'Every active student has set at least the minimum availability.'
                  : tab === 'matched'
                    ? 'Assign mentors from the Needs match tab. Matched pairs show up here.'
                    : students.length === 0
                      ? "Once students complete onboarding, they'll show up here ready to be matched."
                      : `Students enter the queue once they pick at least ${MIN_QUEUE_SLOTS} availability slots.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tab === 'waiting' && (
              <Card className="bg-surface-2 border-line">
                <CardContent className="p-4 text-[13px] text-text-2">
                  These students haven&apos;t set the minimum{' '}
                  {MIN_QUEUE_SLOTS} availability slots yet, so the matcher
                  can&apos;t score them. They show up in the in-queue tab as
                  soon as they save more times.
                </CardContent>
              </Card>
            )}
            {visibleStudents.map((student) => (
              <MatchRow
                key={student.user_id}
                student={student}
                mentorOptions={mentorOptions}
              />
            ))}
          </div>
        )}

        {mentorOptions.length === 0 && students.length > 0 && (
          <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
            <CardContent className="p-5">
              <p className="text-[13px] font-medium text-text">
                No approved mentors available to assign
              </p>
              <p className="mt-1 text-[12px] text-text-2">
                Approve mentor applications under{' '}
                <a
                  href="/admin/mentors?status=pending"
                  className="text-primary hover:underline"
                >
                  Mentors &rarr; Pending review
                </a>{' '}
                before you can complete any matches.
              </p>
            </CardContent>
          </Card>
        )}

        {students.length > 0 && (
          <Card className="bg-surface-2">
            <CardContent className="space-y-2 p-5">
              <p className="text-[13px] font-medium text-text">Legend</p>
              <div className="flex flex-wrap gap-3 text-[12px] text-text-2">
                <span className="flex items-center gap-1.5">
                  <Badge variant="success">Matched</Badge>
                  Has a mentor assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge variant="warning">Unmatched</Badge>
                  Awaiting assignment
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
