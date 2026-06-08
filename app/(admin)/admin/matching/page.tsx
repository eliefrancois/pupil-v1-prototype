import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { isMentorAssignableForMatch } from '@/lib/matching/mentor-eligibility'
import { normalizeOptIns } from '@/lib/scheduling/slots'

import MatchRow, {
  type StudentPendingRequest,
  type MatchMentee,
  type MatchMentorOption,
} from './match-row'

export const dynamic = 'force-dynamic'

/** Coerce a jsonb / text[] value into a clean string array (defensive). */
function asStrArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

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
  created_at: string
  pending_requests: StudentPendingRequest[]
  /** Canonical-taxonomy data the match-strength scorer consumes. */
  match: MatchMentee
}

type MentorOption = MatchMentorOption

export default async function AdminMatchingPage({
  searchParams,
}: {
  searchParams: { show?: string }
}) {
  const tab = searchParams?.show === 'matched' ? 'matched' : 'queue'
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
          'user_id, grade, city, state, interests, colleges, careers, matched_mentor_id, created_at, academic_identity, first_gen, race_ethnicity, fit_preferences'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('mentor_profiles')
        .select(
          'user_id, university, major, active_mentees_count, max_mentees, rating, availability_slots, status, claim_status, claim_email_sent_at, academic_identity, first_gen, race_ethnicity, college_experience, career_aspirations'
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
      const fitPreferences = (row.fit_preferences ?? {}) as Record<
        string,
        unknown
      >
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
        created_at: row.created_at,
        pending_requests: pendingByStudent.get(row.user_id) ?? [],
        match: {
          academic_identity: asStrArray(row.academic_identity),
          first_gen: asStrArray(row.first_gen),
          race_ethnicity: asStrArray(row.race_ethnicity),
          fit_preferences: {
            career_pref: asStrArray(fitPreferences.career_pref),
            college_experience_pref: asStrArray(
              fitPreferences.college_experience_pref
            ),
          },
        },
      }
    })

  const mentorOptions: MentorOption[] = Array.from(
    mentorByUserId.values()
  ).map((m) => {
    const availabilitySlotCount = normalizeOptIns(m.availability_slots).size
    return {
      user_id: m.user_id,
      full_name: mentorNameById.get(m.user_id) ?? '',
      university: m.university,
      major: m.major,
      active_mentees_count: m.active_mentees_count ?? 0,
      max_mentees: m.max_mentees ?? 3,
      rating: m.rating ?? 0,
      availability_slot_count: availabilitySlotCount,
      claim_status: m.claim_status ?? null,
      assignable: isMentorAssignableForMatch({
        claimStatus: m.claim_status,
        availabilitySlotCount,
      }),
      match: {
        academic_identity: asStrArray(m.academic_identity),
        first_gen: asStrArray(m.first_gen),
        race_ethnicity: asStrArray(m.race_ethnicity),
        college_experience: asStrArray(m.college_experience),
        career_aspirations: asStrArray(m.career_aspirations),
      },
    }
  })

  const matchedStudents = students.filter((s) => s.matched_mentor_id)
  const queueStudents = students.filter((s) => !s.matched_mentor_id)
  const visibleStudents = tab === 'matched' ? matchedStudents : queueStudents
  const assignableMentorCount = mentorOptions.filter((m) => m.assignable).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Mentor matching
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            {queueStudents.length} need a match · {matchedStudents.length}{' '}
            matched · {assignableMentorCount} assignable mentor
            {assignableMentorCount === 1 ? '' : 's'}
          </p>
        </div>

        {(queueStudents.length > 0 || matchedStudents.length > 0) && (
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
          </div>
        )}

        {visibleStudents.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <p className="text-[15px] font-semibold text-text">
                {tab === 'matched'
                  ? 'No matched students yet'
                  : students.length === 0
                    ? 'No students yet'
                    : 'No students need a match right now'}
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                {tab === 'matched'
                  ? 'Assign mentors from the Needs match tab. Matched pairs show up here.'
                  : students.length === 0
                    ? "Once students complete onboarding, they'll show up here ready to be matched."
                    : 'Every onboarded student without a mentor appears here. Ghost mentor requests stay visible for outreach but cannot be assigned until claimed.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleStudents.map((student) => (
              <MatchRow
                key={student.user_id}
                student={student}
                mentorOptions={mentorOptions}
              />
            ))}
          </div>
        )}

        {assignableMentorCount === 0 && students.length > 0 && (
          <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
            <CardContent className="p-5">
              <p className="text-[13px] font-medium text-text">
                No mentors ready to assign
              </p>
              <p className="mt-1 text-[12px] text-text-2">
                Approved mentors need to claim their profile (if ghost) and set
                at least one weekly availability slot before you can match them.
                Ghost requests can still nudge mentors via the claim email.
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
                <span className="flex items-center gap-1.5">
                  <Badge variant="secondary">Ghost</Badge>
                  Requestable, not assignable until claimed
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
