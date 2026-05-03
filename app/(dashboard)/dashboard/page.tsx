'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STUDENT, SESSIONS, MENTORS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import Stars from '@/components/stars'
import { ArrowRight, Calendar, MessageCircle, Clock, List, SquareCheck as CheckSquare, Square, Search } from 'lucide-react'

export default function DashboardPage() {
  const matchedMentor = MENTORS.find((m) => m.id === STUDENT.matchedMentor)
  const upcomingSession = SESSIONS.find((s) => s.status === 'upcoming')
  const lastCompleted = SESSIONS.filter((s) => s.status === 'completed')[0]

  if (!matchedMentor) {
    return <UnmatchedState />
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hey, <em className="not-italic italic">{STUDENT.firstName}.</em>
            </h1>
            <p className="mt-1 text-gray-500">
              You&apos;re matched with {matchedMentor.name} this month.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {STUDENT.sessionsRemaining} of {STUDENT.sessionsTotal} sessions left
          </Badge>
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Mentor card - larger */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex gap-5">
                <img
                  src={matchedMentor.photo}
                  alt={matchedMentor.name}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {matchedMentor.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {matchedMentor.university} &middot; {matchedMentor.major}
                    </p>
                  </div>
                  <Stars value={matchedMentor.rating} size={14} />
                  <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                    {matchedMentor.bio}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Button asChild>
                  <Link href="/dashboard/book">Book a session</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/messages">Message</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming session card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {upcomingSession ? (
                <UpcomingSessionCard session={upcomingSession} mentorName={matchedMentor.name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No upcoming sessions</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/dashboard/book">Book one</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Last session breakdown */}
        {lastCompleted?.breakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last session breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lastCompleted.breakdown.actionItems.map((item) => (
                  <ActionItemRow key={item.id} text={item.text} done={item.done} />
                ))}
              </ul>
              <Link
                href={`/dashboard/session/${lastCompleted.id}/breakdown`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A60E4] hover:underline"
              >
                View full breakdown
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/dashboard/history"
            icon={<List className="h-5 w-5" />}
            label="Session history"
          />
          <QuickAction
            href="/dashboard/messages"
            icon={<MessageCircle className="h-5 w-5" />}
            label="Messages"
          />
          <QuickAction
            href="/dashboard/book"
            icon={<Calendar className="h-5 w-5" />}
            label="Book a session"
          />
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function UpcomingSessionCard({
  session,
  mentorName,
}: {
  session: (typeof SESSIONS)[number]
  mentorName: string
}) {
  const start = new Date(session.startsAt)
  const now = new Date()
  const diffMs = start.getTime() - now.getTime()
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  const countdownLabel =
    diffDays > 0
      ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
      : diffHours > 0
        ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
        : 'starting soon'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming session</h3>
        <Badge variant="secondary" className="text-xs">
          <Clock className="mr-1 h-3 w-3" />
          {countdownLabel}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900">
          {start.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-sm text-gray-500">
          {start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          &middot; {session.duration} min &middot; {mentorName}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/session/${session.id}`}>View icebreakers</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/dashboard/session/${session.id}`}>Join</Link>
        </Button>
      </div>
    </div>
  )
}

function ActionItemRow({ text, done }: { text: string; done: boolean }) {
  const [checked, setChecked] = useState(done)

  return (
    <li className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className="mt-0.5 shrink-0 text-gray-400 hover:text-[#7A60E4]"
      >
        {checked ? (
          <CheckSquare className="h-4 w-4 text-[#7A60E4]" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>
      <span
        className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
      >
        {text}
      </span>
    </li>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-[#7A60E4]/30 hover:bg-[#7A60E4]/5">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="text-[#7A60E4]">{icon}</div>
            <span className="text-sm font-medium text-gray-900">{label}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </CardContent>
      </Card>
    </Link>
  )
}

/* ---------- Unmatched state ---------- */

function UnmatchedState() {
  const suggestedMentors = MENTORS.slice(0, 3)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hey, <em className="not-italic italic">{STUDENT.firstName}.</em>
          </h1>
          <p className="mt-1 text-gray-500">
            We&apos;re setting things up for you.
          </p>
        </div>

        {/* Finding mentor card */}
        <Card className="border-[#7A60E4]/20 bg-[#7A60E4]/5">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 animate-pulse rounded-full bg-[#7A60E4]/20" />
              <Search className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-[#7A60E4]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              We&apos;re finding you a mentor
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Based on your interests, goals, and background, we&apos;re matching
              you with the right mentor. This usually takes 24&ndash;48 hours.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/dashboard/mentor">Browse mentors</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Suggested mentors */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Mentors you might like
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {suggestedMentors.map((mentor) => (
              <Card key={mentor.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={mentor.photo}
                      alt={mentor.name}
                      size="lg"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {mentor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mentor.university}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {mentor.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {mentor.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
