import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Calendar, Lock } from 'lucide-react'
import { addDays } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UpgradeBanner from '@/components/upgrade-banner'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor, getStudentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import {
  BOOKING_HORIZON_DAYS,
  getOpenSlots,
  normalizeOptIns,
} from '@/lib/scheduling/slots'

import BookingClient from './booking-client'

export default async function BookPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/book')

  const isPaid = user.subscription_status !== 'inactive'

  const profile = await getStudentProfile(user.id)
  const mentor = await getMatchedMentor(profile?.matched_mentor_id)

  // If no profile or no matched mentor: show the locked / unmatched state.
  if (!profile || !mentor) {
    return <NoMentorState isPaid={isPaid} />
  }

  if (!isPaid) {
    return <PaywallState mentorName={mentor.full_name} />
  }

  const supabase = createClient()
  const [{ data: mentorRow }, { data: studentRow }, { data: existing }] =
    await Promise.all([
      supabase
        .from('mentor_profiles')
        .select('availability_slots, status, timezone')
        .eq('user_id', mentor.user_id)
        .single<{
          availability_slots: unknown
          status: string
          timezone: string | null
        }>(),
      supabase
        .from('student_profiles')
        .select('sessions_total, sessions_used')
        .eq('user_id', user.id)
        .single<{
          sessions_total: number
          sessions_used: number
        }>(),
      supabase
        .from('session_bookings')
        .select('starts_at')
        .eq('mentor_id', mentor.user_id)
        .in('status', ['upcoming', 'completed'])
        .gte('starts_at', new Date().toISOString())
        .lte(
          'starts_at',
          addDays(new Date(), BOOKING_HORIZON_DAYS + 1).toISOString()
        ),
    ])

  const mentorSlots = normalizeOptIns(mentorRow?.availability_slots)
  const sessionsTotal = studentRow?.sessions_total ?? 24
  const sessionsUsed = studentRow?.sessions_used ?? 0
  const sessionsRemaining = Math.max(0, sessionsTotal - sessionsUsed)

  const mentorIsActive = mentorRow?.status === 'approved'
  const mentorHasSlots = mentorSlots.size > 0

  const existingBookings = (existing ?? []).map((row) => ({
    startsAt: new Date(row.starts_at),
  }))

  const openSlots = mentorIsActive
    ? getOpenSlots({
        mentorOptIns: mentorSlots,
        existingBookings,
      })
    : []

  return (
    <BookingClient
      mentorId={mentor.user_id}
      mentorName={mentor.full_name}
      mentorUniversity={mentor.university}
      mentorTimezone={mentorRow?.timezone ?? null}
      sessionsRemaining={sessionsRemaining}
      sessionsTotal={sessionsTotal}
      mentorIsActive={mentorIsActive}
      mentorHasSlots={mentorHasSlots}
      openSlots={openSlots.map((s) => ({
        startsAtIso: s.startsAt.toISOString(),
        day: s.day,
        slot: s.slot,
      }))}
    />
  )
}

function NoMentorState({ isPaid }: { isPaid: boolean }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <BackLink />
        <div>
          <h1 className="display text-[28px] leading-tight">Book a session</h1>
        </div>
        {!isPaid && <UpgradeBanner />}
        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center p-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text">
              You don&apos;t have a mentor yet
            </p>
            <p className="mt-1 max-w-md text-[13px] text-text-2">
              Once we match you with a mentor, you&apos;ll be able to book
              sessions here.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="outline">
                <Link href="/mentors">Browse mentors</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PaywallState({ mentorName }: { mentorName: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <BackLink />
        <div>
          <h1 className="display text-[28px] leading-tight">Book a session</h1>
          <p className="mt-1 text-[14px] text-text-2">With {mentorName}</p>
        </div>
        <UpgradeBanner />
        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center p-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text">
              Upgrade to book sessions
            </p>
            <p className="mt-1 max-w-md text-[13px] text-text-2">
              Unlock 24 sessions per year, in-app messaging, and recordings
              with the upgrade.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to dashboard
    </Link>
  )
}
