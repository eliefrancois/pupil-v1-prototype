import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CheckCircle as CheckCircle,
  ChevronRight,
  Flag,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'

import StatCard from '@/components/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
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
  const [
    { count: pendingMentors },
    { count: approvedMentors },
    { count: totalStudents },
    { count: unmatchedStudents },
    { count: openFlags },
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
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student'),
    supabase
      .from('student_profiles')
      .select('user_id', { count: 'exact', head: true })
      .is('matched_mentor_id', null),
    supabase
      .from('safety_flags')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const quickActions = [
    {
      href: '/admin/mentors?status=pending',
      title: 'Mentor applications',
      description:
        pendingMentors && pendingMentors > 0
          ? `${pendingMentors} application${pendingMentors === 1 ? '' : 's'} awaiting review`
          : 'No pending applications',
      icon: UserCheck,
      badge:
        pendingMentors && pendingMentors > 0
          ? { text: String(pendingMentors), variant: 'warning' as const }
          : null,
    },
    {
      href: '/admin/matching',
      title: 'Matching queue',
      description:
        unmatchedStudents && unmatchedStudents > 0
          ? `${unmatchedStudents} student${unmatchedStudents === 1 ? '' : 's'} awaiting a match`
          : 'All students matched',
      icon: Users,
      badge:
        unmatchedStudents && unmatchedStudents > 0
          ? { text: String(unmatchedStudents), variant: 'warning' as const }
          : null,
    },
    {
      href: '/admin/flags',
      title: 'Safety flags',
      description:
        openFlags && openFlags > 0
          ? `${openFlags} open flag${openFlags === 1 ? '' : 's'}`
          : 'No open flags',
      icon: Flag,
      badge:
        openFlags && openFlags > 0
          ? { text: String(openFlags), variant: 'danger' as const }
          : null,
    },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="display text-[28px] leading-tight">
            Trust &amp; Safety dashboard
          </h1>
          <p className="mt-1 text-[14px] text-text-2">{today}</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending applications"
            value={pendingMentors ?? 0}
            trend={
              pendingMentors && pendingMentors > 0
                ? 'Requires review'
                : undefined
            }
            tone={
              pendingMentors && pendingMentors > 0 ? 'warning' : undefined
            }
            icon={<UserCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Approved mentors"
            value={approvedMentors ?? 0}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Students"
            value={totalStudents ?? 0}
            trend={
              unmatchedStudents && unmatchedStudents > 0
                ? `${unmatchedStudents} unmatched`
                : undefined
            }
            tone={
              unmatchedStudents && unmatchedStudents > 0 ? 'warning' : undefined
            }
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            label="Open safety flags"
            value={openFlags ?? 0}
            tone={openFlags && openFlags > 0 ? 'danger' : undefined}
            icon={<Flag className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-[var(--radius-sm)] bg-primary-light p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-text">
                          {action.title}
                        </p>
                        {action.badge && (
                          <Badge variant={action.badge.variant}>
                            {action.badge.text}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-text-2">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-3" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 rounded-[var(--radius-sm)] bg-surface-2 p-4 text-[12px] text-text-2">
          <p className="font-medium text-text">
            <CheckCircle className="mr-1.5 inline h-3.5 w-3.5" />
            Tip
          </p>
          <p className="mt-1">
            Approve mentor applications under{' '}
            <Link
              href="/admin/mentors?status=pending"
              className="text-primary hover:underline"
            >
              Mentors &rarr; Pending review
            </Link>
            . Once a mentor is approved they appear in the public directory and
            can be assigned to students under{' '}
            <Link href="/admin/matching" className="text-primary hover:underline">
              Matching
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
