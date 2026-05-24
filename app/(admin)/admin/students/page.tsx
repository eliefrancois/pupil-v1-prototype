import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type StudentRow = {
  user_id: string
  full_name: string
  email: string
  grade: number | null
  location: string | null
  colleges: string[]
  matched_mentor_name: string | null
  sessions_count: number
  created_at: string
}

export default async function StudentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/students')
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

  const supabase = createClient()

  const [profilesRes, usersRes, sessionsRes] = await Promise.all([
    supabase
      .from('student_profiles')
      .select(
        'user_id, grade, city, state, colleges, matched_mentor_id, created_at'
      )
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, full_name, email, role'),
    supabase
      .from('session_bookings')
      .select('student_id, status'),
  ])

  const userById = new Map(
    (usersRes.data ?? []).map((u) => [
      u.id,
      u as { id: string; full_name: string; email: string; role: string },
    ])
  )
  const mentorNameById = new Map(
    Array.from(userById.values())
      .filter((u) => u.role === 'mentor')
      .map((u) => [u.id, u.full_name])
  )

  const sessionsByStudent = new Map<string, number>()
  for (const row of sessionsRes.data ?? []) {
    if (row.status !== 'completed') continue
    sessionsByStudent.set(
      row.student_id,
      (sessionsByStudent.get(row.student_id) ?? 0) + 1
    )
  }

  const students: StudentRow[] = (profilesRes.data ?? [])
    .filter((row) => userById.get(row.user_id)?.role === 'student')
    .map((row) => {
      const u = userById.get(row.user_id)
      const location =
        row.city && row.state
          ? `${row.city}, ${row.state}`
          : row.city ?? row.state ?? null
      return {
        user_id: row.user_id,
        full_name: u?.full_name ?? 'Unknown',
        email: u?.email ?? '',
        grade: row.grade,
        location,
        colleges: row.colleges ?? [],
        matched_mentor_name: row.matched_mentor_id
          ? (mentorNameById.get(row.matched_mentor_id) ?? 'Assigned')
          : null,
        sessions_count: sessionsByStudent.get(row.user_id) ?? 0,
        created_at: row.created_at,
      }
    })

  const matchedCount = students.filter((s) => s.matched_mentor_name).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="display text-[28px] leading-tight">Students</h1>
          <p className="mt-1 text-[14px] text-text-2">
            {students.length} enrolled · {matchedCount} matched ·{' '}
            {students.length - matchedCount} unmatched
          </p>
        </div>

        {students.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <p className="text-[15px] font-semibold text-text">
                No students yet
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                Students appear here after they complete onboarding.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Target schools
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-text-2">
                        Sessions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student) => (
                      <tr
                        key={student.user_id}
                        className="transition-colors hover:bg-surface-2"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar alt={student.full_name} size="sm" />
                            <div>
                              <p className="font-medium text-text">
                                {student.full_name}
                              </p>
                              <p className="text-[12px] text-text-3">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-2">
                          {student.grade ? `Grade ${student.grade}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-text-2">
                          {student.location ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-text-2">
                          {student.colleges.length > 0
                            ? student.colleges.slice(0, 2).join(', ') +
                              (student.colleges.length > 2
                                ? ` +${student.colleges.length - 2}`
                                : '')
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {student.matched_mentor_name ? (
                            <span className="text-text-2">
                              {student.matched_mentor_name}
                            </span>
                          ) : (
                            <Badge variant="warning">Unmatched</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-text-2">
                          {student.sessions_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="mt-4 text-[12px] text-text-3">
          To assign mentors, use{' '}
          <Link href="/admin/matching" className="text-primary hover:underline">
            Matching queue
          </Link>
          . Student-initiated requests live under{' '}
          <Link href="/admin/matching" className="text-primary hover:underline">
            Match requests
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
