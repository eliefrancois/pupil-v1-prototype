'use client'

import Link from 'next/link'
import { MENTORS, SESSIONS, MATCHING_QUEUE, daysFromNow } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Stars from '@/components/stars'
import StatCard from '@/components/stat-card'
import { Users, Calendar, Star, TriangleAlert as AlertTriangle, ArrowRight, Video } from 'lucide-react'

/* ---------- Mock mentor-specific data ---------- */

const MENTOR = MENTORS.find((m) => m.id === 'm_amara')!

const UPCOMING_SESSIONS = [
  {
    id: 'ms_1',
    studentName: 'Riley Park',
    school: 'West Mesa HS',
    grade: 11,
    startsAt: daysFromNow(2, 16, 30),
    focusTopic: 'Stanford supplements',
  },
  {
    id: 'ms_2',
    studentName: 'Jordan Tate',
    school: 'Roosevelt HS',
    grade: 12,
    startsAt: daysFromNow(4, 15, 0),
    focusTopic: 'First call intro',
  },
  {
    id: 'ms_3',
    studentName: 'Marcus Bell',
    school: 'Garfield HS',
    grade: 11,
    startsAt: daysFromNow(6, 17, 0),
    focusTopic: 'Robotics activity essay',
  },
]

const PENDING_RATINGS = [
  { sessionId: 'pr_1', studentName: 'Sofia Reyes' },
  { sessionId: 'pr_2', studentName: 'Theo Bennett' },
]

/* ---------- Helpers ---------- */

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/* ---------- Page ---------- */

export default function MentorDashboardPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, <em className="not-italic italic">Amara.</em>
          </h1>
          <p className="mt-1 text-gray-500">
            Two sessions on the schedule this week.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active mentees"
            value={6}
            trend="+1 this month"
            tone="success"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Total sessions"
            value={142}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            label="Avg rating"
            value={4.9}
            icon={<Stars value={5} size={12} />}
          />
          <StatCard
            label="Pending ratings"
            value={2}
            trend="Needs attention"
            tone="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>

        {/* Upcoming sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming sessions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UPCOMING_SESSIONS.map((session) => (
              <Card key={session.id}>
                <CardContent className="space-y-4 p-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {session.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.school} &middot; Grade {session.grade}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      {formatSessionDate(session.startsAt)} at{' '}
                      {formatSessionTime(session.startsAt)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {session.focusTopic}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/mentor/session/${session.id}`}>
                        Icebreakers
                      </Link>
                    </Button>
                    <Button size="sm">
                      <Video className="mr-1.5 h-3.5 w-3.5" />
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pending breakdowns to rate */}
        <Card className="border-[#7A60E4]/20 bg-[#7A60E4]/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Pending breakdowns to rate
              </h3>
              <p className="text-sm text-gray-600">
                2 sessions waiting on your rating &mdash;{' '}
                {PENDING_RATINGS.map((r) => r.studentName).join(', ')}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/mentor/history">
                Review pending
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
