import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Calendar,
  Clock,
  List,
  Lock,
  MessageCircle,
  Search,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import Stars from '@/components/stars'
import UpgradeBanner from '@/components/upgrade-banner'
import { getCurrentUser } from '@/lib/supabase/get-user'
import {
  getStudentProfile,
  getMatchedMentor,
  getStudentSessionUsage,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { normalizeOptIns } from '@/lib/scheduling/slots'
import {
  MIN_QUEUE_SLOTS,
  isMatchQueueEligible,
} from '@/lib/scheduling/canonical-slots'
import type { PublicMentor } from '@/lib/types/mentor'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard')

  const isPaid = user.subscription_status !== 'inactive'
  const firstName = user.full_name?.split(' ')[0] || 'there'

  const profile = await getStudentProfile(user.id)
  const matchedMentor = await getMatchedMentor(profile?.matched_mentor_id)

  const supabase = createClient()
  const { data: slotsRow } = await supabase
    .from('student_profiles')
    .select('availability_slots')
    .eq('user_id', user.id)
    .maybeSingle<{ availability_slots: unknown }>()
  const availabilityCount = normalizeOptIns(slotsRow?.availability_slots).size

  if (!matchedMentor) {
    return (
      <UnmatchedState
        firstName={firstName}
        isPaid={isPaid}
        availabilityCount={availabilityCount}
      />
    )
  }

  const usage = await getStudentSessionUsage(user.id)

  return (
    <div className="page-enter">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="display text-[32px] leading-tight">
              Hey, <em className="italic font-normal">{firstName}.</em>
            </h1>
            <p className="mt-1 text-text-2">
              You&apos;re matched with {matchedMentor.full_name} this month.
            </p>
          </div>
          {isPaid && (
            <Badge variant="secondary">
              {usage.remaining} of {usage.total} sessions left
            </Badge>
          )}
        </div>

        {!isPaid && <UpgradeBanner />}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={matchedMentor.photo_url ?? ''}
                  alt={matchedMentor.full_name}
                  className="h-24 w-24 rounded-[var(--radius)] object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-[18px] font-semibold text-text">
                      {matchedMentor.full_name}
                    </h2>
                    <p className="text-[13px] text-text-2">
                      {matchedMentor.university}
                      {matchedMentor.major && ` · ${matchedMentor.major}`}
                    </p>
                  </div>
                  <Stars value={Number(matchedMentor.rating)} size={14} />
                  {matchedMentor.bio && (
                    <p className="text-[14px] leading-relaxed text-text-2 line-clamp-2">
                      {matchedMentor.bio}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {isPaid ? (
                  <>
                    <Button asChild>
                      <Link href="/dashboard/book">Book a session</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/messages">Message</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link href="/pricing">
                        <Lock className="h-4 w-4" />
                        Upgrade to book
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/pricing">
                        <Lock className="h-4 w-4" />
                        Upgrade to message
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {usage.upcoming ? (
                <UpcomingSessionCard
                  startsAt={usage.upcoming.starts_at}
                  duration={usage.upcoming.duration}
                  mentorName={matchedMentor.full_name}
                  sessionId={usage.upcoming.id}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-text-3" />
                  <p className="text-[14px] text-text-2">
                    No upcoming sessions
                  </p>
                  {isPaid ? (
                    <Button size="sm" className="mt-4" asChild>
                      <Link href="/dashboard/book">Book one</Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="mt-4" asChild>
                      <Link href="/pricing">Upgrade to book</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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

function UpcomingSessionCard({
  startsAt,
  duration,
  mentorName,
  sessionId,
}: {
  startsAt: string
  duration: number
  mentorName: string
  sessionId: string
}) {
  const start = new Date(startsAt)
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
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
          Upcoming session
        </h3>
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          {countdownLabel}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-text">
          {start.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-[13px] text-text-2">
          {start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          · {duration} min · {mentorName}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/session/${sessionId}`}>View icebreakers</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/dashboard/session/${sessionId}`}>Join</Link>
        </Button>
      </div>
    </div>
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
      <Card hover>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light text-primary">
              {icon}
            </div>
            <span className="text-[14px] font-medium text-text">{label}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-text-3" />
        </CardContent>
      </Card>
    </Link>
  )
}

async function UnmatchedState({
  firstName,
  isPaid,
  availabilityCount,
}: {
  firstName: string
  isPaid: boolean
  availabilityCount: number
}) {
  const supabase = createClient()
  const { data } = await supabase
    .from('public_mentor_profiles')
    .select('*')
    .order('rating', { ascending: false })
    .limit(3)
  const suggested = (data ?? []) as PublicMentor[]

  const inQueue = isMatchQueueEligible(availabilityCount)
  const needsMoreSlots = availabilityCount > 0 && !inQueue
  const slotsNeeded = Math.max(0, MIN_QUEUE_SLOTS - availabilityCount)

  return (
    <div className="page-enter">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div>
          <h1 className="display text-[32px] leading-tight">
            Hey, <em className="italic font-normal">{firstName}.</em>
          </h1>
          <p className="mt-1 text-text-2">
            {isPaid
              ? "We're setting things up for you."
              : 'Welcome to Pupil. Browse mentors below to see what your match could look like.'}
          </p>
        </div>

        {!isPaid && <UpgradeBanner />}

        {!inQueue && (
          <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10 text-warning">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    {needsMoreSlots
                      ? `Add ${slotsNeeded} more slot${slotsNeeded === 1 ? '' : 's'} to enter the matching queue`
                      : "You're not in the matching queue yet"}
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-2">
                    {needsMoreSlots
                      ? `You've picked ${availabilityCount} of ${MIN_QUEUE_SLOTS} required slots. The more times you can meet, the better your match.`
                      : `Pick at least ${MIN_QUEUE_SLOTS} times you can usually meet so we can match you with a mentor whose schedule overlaps yours.`}
                  </p>
                </div>
              </div>
              <Button asChild className="sm:shrink-0">
                <Link href="/dashboard/schedule">
                  {needsMoreSlots ? 'Add more slots' : 'Set availability'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isPaid && inQueue && (
          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary-light pulse-ring" />
                <Search className="relative h-7 w-7 text-primary" />
              </div>
              <h2 className="text-[18px] font-semibold text-text">
                You&apos;re in the matching queue
              </h2>
              <p className="mt-2 max-w-md text-[14px] text-text-2">
                Based on your interests, goals, and availability, we&apos;re
                pairing you with the right mentor. Expected match within 24 to
                48 hours.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/schedule">Edit availability</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/mentors">Browse mentors</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isPaid && !inQueue && (
          <Card className="bg-surface-2 border-line">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Search className="mb-4 h-7 w-7 text-text-3" />
              <h2 className="text-[16px] font-semibold text-text">
                Mentor matching paused
              </h2>
              <p className="mt-1 max-w-md text-[13px] text-text-2">
                You&apos;ll enter the queue as soon as you&apos;ve picked at
                least {MIN_QUEUE_SLOTS} availability slots. Browse mentors
                below to see who you might be matched with.
              </p>
            </CardContent>
          </Card>
        )}

        {suggested.length > 0 && (
          <div>
            <h2 className="mb-4 text-[16px] font-semibold text-text">
              Mentors you might like
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {suggested.map((mentor) => (
                <Link key={mentor.id} href={`/mentors/${mentor.id}`}>
                  <Card hover>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={mentor.photo_url}
                          alt={mentor.display_name}
                          size="lg"
                        />
                        <div>
                          <p className="text-[14px] font-semibold text-text">
                            {mentor.display_name}
                          </p>
                          <p className="text-[12px] text-text-2">
                            {mentor.university}
                          </p>
                        </div>
                      </div>
                      {mentor.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {mentor.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {mentor.bio && (
                        <p className="mt-3 text-[12px] leading-relaxed text-text-2 line-clamp-2">
                          {mentor.bio}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
