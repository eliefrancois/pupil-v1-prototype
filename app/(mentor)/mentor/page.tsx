import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  CircleCheck,
  Clock,
  ExternalLink,
  Pause,
  Star,
  Users,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/stat-card'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  getMentorUpcomingSessions,
  type MentorUpcoming,
} from '@/lib/supabase/queries'
import { normalizeOptIns } from '@/lib/scheduling/slots'
import { formatSlot } from '@/lib/scheduling/slots'

export default async function MentorDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mentor')
  if (user.role !== 'mentor') {
    redirect(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select(
      'university, major, status, max_mentees, active_mentees_count, sessions_count, rating, photo_url, bio, tags, availability_slots, submitted_at, reviewed_at, review_notes'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/mentor-onboarding')
  }

  const upcomingSessions =
    profile.status === 'approved'
      ? await getMentorUpcomingSessions(user.id, 5)
      : []
  const slotCount = normalizeOptIns(profile.availability_slots).size

  const firstName = user.full_name?.split(' ')[0] || 'there'

  if (profile.status === 'pending') {
    return <PendingState firstName={firstName} submittedAt={profile.submitted_at} />
  }

  if (profile.status === 'rejected') {
    return (
      <RejectedState
        firstName={firstName}
        reviewNotes={profile.review_notes}
      />
    )
  }

  if (profile.status === 'paused') {
    return <PausedState firstName={firstName} />
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div>
          <h1 className="display text-[32px] leading-tight">
            Welcome back, <em className="italic font-normal">{firstName}.</em>
          </h1>
          <p className="mt-1 text-text-2">
            {profile.active_mentees_count > 0
              ? `You're mentoring ${profile.active_mentees_count} ${profile.active_mentees_count === 1 ? 'student' : 'students'} right now.`
              : "You're approved and ready to be matched. We'll email you when your first mentee is assigned."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active mentees"
            value={profile.active_mentees_count}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Capacity"
            value={`${profile.active_mentees_count} / ${profile.max_mentees}`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Total sessions"
            value={profile.sessions_count}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            label="Avg rating"
            value={
              profile.sessions_count > 0
                ? Number(profile.rating).toFixed(1)
                : '\u2014'
            }
            icon={<Star className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-start gap-4">
              {profile.photo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.photo_url}
                  alt={user.full_name ?? 'Profile'}
                  className="h-16 w-16 rounded-[var(--radius)] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-primary-light text-[20px] font-semibold text-primary">
                  {firstName[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-text">
                  {user.full_name}
                </p>
                <p className="text-[13px] text-text-2">
                  {profile.university}
                  {profile.major && ` \u00b7 ${profile.major}`}
                </p>
                {profile.tags && profile.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile.tags.slice(0, 4).map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/mentors/${user.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                View public profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        {slotCount === 0 && (
          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex items-start gap-4 p-6">
              <CalendarPlus className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-text">
                  Set your weekly availability
                </p>
                <p className="mt-1 text-[13px] text-text-2">
                  Pick the canonical session times you can usually meet so
                  matched students can book you.
                </p>
                <Button size="sm" className="mt-4" asChild>
                  <Link href="/mentor/schedule">
                    Set availability
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <UpcomingMentorSessions sessions={upcomingSessions} />
      </div>
    </div>
  )
}

function UpcomingMentorSessions({ sessions }: { sessions: MentorUpcoming[] }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <p className="text-[14px] font-semibold text-text">
              No upcoming sessions
            </p>
            <p className="mt-1 text-[13px] text-text-2">
              Once a matched student books you, you&apos;ll see the session
              listed here.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/mentor/schedule">Edit availability</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[16px] font-semibold text-text">Upcoming sessions</h2>
      {sessions.map((s) => {
        const startsAt = new Date(s.starts_at)
        return (
          <Card key={s.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[14px] font-semibold text-text">
                  {formatSlot(startsAt)}
                </p>
                <p className="mt-0.5 text-[13px] text-text-2">
                  {s.duration} min &middot;{' '}
                  {s.student?.full_name ?? 'Pending student'}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/mentor/session/${s.id}`}>View details</Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function PendingState({
  firstName,
  submittedAt,
}: {
  firstName: string
  submittedAt: string | null
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Thanks, <em className="italic font-normal">{firstName}.</em>
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            Your application is in review.
          </p>
        </div>

        <Card className="bg-primary-soft border-primary-light">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary-light pulse-ring" />
              <Clock className="relative h-7 w-7 text-primary" />
            </div>
            <h2 className="text-[18px] font-semibold text-text">
              We&apos;re reviewing your application
            </h2>
            <p className="mt-2 max-w-md text-[14px] text-text-2">
              We typically respond within 1-2 business days. We&apos;ll email
              you as soon as your profile is approved and we&apos;re ready to
              match you with your first mentee.
            </p>
            {submittedAt && (
              <p className="mt-4 text-[12px] text-text-3">
                Submitted{' '}
                {new Date(submittedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-[14px] font-semibold text-text">
              While you wait
            </p>
            <ul className="space-y-2 text-[13px] text-text-2">
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>
                  Update your profile or change details:{' '}
                  <Link
                    href="/mentor-onboarding"
                    className="text-primary hover:underline"
                  >
                    edit application
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>
                  Browse the existing mentor directory:{' '}
                  <Link
                    href="/mentors"
                    className="text-primary hover:underline"
                  >
                    see who&apos;s on Pupil
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>
                  Questions? Email{' '}
                  <a
                    href="mailto:support@getpupil.com"
                    className="text-primary hover:underline"
                  >
                    support@getpupil.com
                  </a>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RejectedState({
  firstName,
  reviewNotes,
}: {
  firstName: string
  reviewNotes: string | null
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Hi, <em className="italic font-normal">{firstName}.</em>
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            An update on your application.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-[14px] font-semibold text-text">
              Your application wasn&apos;t approved this round
            </p>
            <p className="text-[13px] text-text-2">
              We can&apos;t move forward with your application at this time.
              {reviewNotes ? (
                <>
                  {' '}
                  Note from our team:{' '}
                  <span className="block mt-2 rounded-[var(--radius-sm)] bg-surface-2 p-3 text-[13px] text-text">
                    &ldquo;{reviewNotes}&rdquo;
                  </span>
                </>
              ) : null}
            </p>
            <p className="text-[13px] text-text-2">
              If you think this was a mistake or want to reapply later, email{' '}
              <a
                href="mailto:support@getpupil.com"
                className="text-primary hover:underline"
              >
                support@getpupil.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PausedState({ firstName }: { firstName: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">
            Hi, <em className="italic font-normal">{firstName}.</em>
          </h1>
        </div>

        <Card className="border-warning bg-[rgba(245,158,11,0.05)]">
          <CardContent className="flex items-start gap-4 p-6">
            <Pause className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text">
                Your account is paused
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                You won&apos;t be matched with new mentees while your account is
                paused. To unpause or ask questions, email{' '}
                <a
                  href="mailto:support@getpupil.com"
                  className="text-primary hover:underline"
                >
                  support@getpupil.com
                </a>
                .
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/mentors">
                  Browse the directory
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
