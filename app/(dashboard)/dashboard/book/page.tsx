import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Calendar, CalendarCheck, Sparkles } from 'lucide-react'
import { addDays } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UpgradeButton from '@/components/billing/upgrade-button'
import type { MentorSummary } from '@/components/billing/upgrade-dialog'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { getStudentEntitlements } from '@/lib/entitlements'
import { isBillingConfigured } from '@/lib/billing/stripe'
import { toMentorSummary } from '@/lib/billing/mentor-summary'
import {
  BOOKING_HORIZON_DAYS,
  getOpenSlots,
  normalizeOptIns,
} from '@/lib/scheduling/slots'

import BookingClient from './booking-client'

export default async function BookPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/book')

  const entitlements = await getStudentEntitlements(user.id)
  const mentor = await getMatchedMentor(entitlements.mentorId)

  if (!mentor) {
    return <NoMentorState />
  }

  const mentorSummary = toMentorSummary(mentor)

  if (!entitlements.canBook) {
    return entitlements.freeSession === 'booked' && entitlements.freeSessionBookingId ? (
      <FreeSessionBookedState
        mentor={mentorSummary}
        bookingId={entitlements.freeSessionBookingId}
        billingEnabled={isBillingConfigured()}
      />
    ) : (
      <UpgradeState mentor={mentorSummary} billingEnabled={isBillingConfigured()} />
    )
  }

  const supabase = createClient()
  const [{ data: mentorRow }, { data: existing }] = await Promise.all([
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
      isFreeSession={entitlements.canBookFreeSession}
      sessionsRemaining={entitlements.sessionsRemaining ?? 0}
      sessionsTotal={entitlements.sessionsTotal}
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

function NoMentorState() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <BackLink />
        <div>
          <h1 className="display text-[28px] leading-tight">Book a session</h1>
        </div>
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
              sessions here. Your first one is free.
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

function FreeSessionBookedState({
  mentor,
  bookingId,
  billingEnabled,
}: {
  mentor: MentorSummary
  bookingId: string
  billingEnabled: boolean
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <BackLink />
        <div>
          <h1 className="display text-[28px] leading-tight">Book a session</h1>
          <p className="mt-1 text-[14px] text-text-2">With {mentor.fullName}</p>
        </div>
        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center p-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text">
              Your free session with {mentor.firstName} is booked
            </p>
            <p className="mt-1 max-w-md text-[13px] text-text-2">
              Want to keep meeting after that? Subscribe for up to 24 sessions a
              year. Messaging stays free either way.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href={`/dashboard/session/${bookingId}`}>View your session</Link>
              </Button>
              <UpgradeButton mentor={mentor} billingEnabled={billingEnabled} source="book">
                See the plan
              </UpgradeButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UpgradeState({
  mentor,
  billingEnabled,
}: {
  mentor: MentorSummary
  billingEnabled: boolean
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <BackLink />
        <div>
          <h1 className="display text-[28px] leading-tight">Book a session</h1>
          <p className="mt-1 text-[14px] text-text-2">With {mentor.fullName}</p>
        </div>
        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center p-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text">
              You&apos;ve used your free session
            </p>
            <p className="mt-1 max-w-md text-[13px] text-text-2">
              Subscribe to keep meeting with {mentor.firstName}, up to 24
              sessions a year. You can still message {mentor.firstName} for
              free.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/dashboard/messages">Message {mentor.firstName}</Link>
              </Button>
              <UpgradeButton
                mentor={mentor}
                billingEnabled={billingEnabled}
                source="book"
                autoOpen
              >
                Subscribe
              </UpgradeButton>
            </div>
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
