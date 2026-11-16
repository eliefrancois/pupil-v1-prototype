import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

/**
 * What a student can do, derived from their plan, match, and bookings.
 *
 * Plans: 'subscribed' ($99/month via Stripe), 'free_access' (eligibility),
 * or 'none'. Every matched student can message their mentor. Matched
 * students without a plan get one free session: their first session ever.
 * A booking made with it has `is_free_trial`; it stops counting once
 * `free_trial_released_at` is set (early cancel, mentor cancel or no-show),
 * which the session_bookings_entitlement_guard trigger stamps. The same
 * trigger and the session_bookings_one_free_trial index enforce this in the DB.
 */

export type Plan = 'subscribed' | 'free_access' | 'none'
export type FreeSessionState = 'available' | 'booked' | 'used'

export type Entitlements = {
  plan: Plan
  hasPlan: boolean
  isMatched: boolean
  mentorId: string | null
  canMessage: boolean
  freeSession: FreeSessionState
  freeSessionBookingId: string | null
  canBookFreeSession: boolean
  canBook: boolean
  /** Plan credits left this period; null without a plan. */
  sessionsRemaining: number | null
  sessionsTotal: number
  freeSessionModal: { seenAt: string | null; shows: number }
  upgradeModalSeenAt: string | null
}

export type EntitlementBooking = {
  id: string
  status: string
  starts_at: string
  is_free_trial: boolean
  free_trial_released_at: string | null
}

export type EntitlementInput = {
  subscriptionStatus: string | null
  profile: {
    matched_mentor_id: string | null
    sessions_total: number | null
    sessions_used: number | null
    free_session_modal_seen_at: string | null
    free_session_modal_shows: number | null
    upgrade_modal_seen_at: string | null
  } | null
  bookings: EntitlementBooking[]
}

const COUNTED_STATUSES = new Set(['upcoming', 'completed', 'no_show'])
const DEFAULT_SESSIONS_TOTAL = 24

export function planFromStatus(status: string | null | undefined): Plan {
  if (status === 'active') return 'subscribed'
  if (status === 'free') return 'free_access'
  return 'none'
}

export function computeEntitlements(input: EntitlementInput): Entitlements {
  const plan = planFromStatus(input.subscriptionStatus)
  const hasPlan = plan !== 'none'
  const mentorId = input.profile?.matched_mentor_id ?? null
  const isMatched = mentorId !== null

  const heldFreeTrial = input.bookings.find(
    (b) => b.is_free_trial && !b.free_trial_released_at
  )
  const hadOtherSession = input.bookings.some(
    (b) => !b.is_free_trial && COUNTED_STATUSES.has(b.status)
  )

  const freeSession: FreeSessionState = heldFreeTrial
    ? heldFreeTrial.status === 'upcoming'
      ? 'booked'
      : 'used'
    : hadOtherSession
      ? 'used'
      : 'available'

  const canBookFreeSession = isMatched && !hasPlan && freeSession === 'available'

  const sessionsTotal = input.profile?.sessions_total ?? DEFAULT_SESSIONS_TOTAL
  const sessionsRemaining = hasPlan
    ? Math.max(0, sessionsTotal - (input.profile?.sessions_used ?? 0))
    : null

  return {
    plan,
    hasPlan,
    isMatched,
    mentorId,
    canMessage: isMatched,
    freeSession,
    freeSessionBookingId: heldFreeTrial?.id ?? null,
    canBookFreeSession,
    canBook: isMatched && (hasPlan || canBookFreeSession),
    sessionsRemaining,
    sessionsTotal,
    freeSessionModal: {
      seenAt: input.profile?.free_session_modal_seen_at ?? null,
      shows: input.profile?.free_session_modal_shows ?? 0,
    },
    upgradeModalSeenAt: input.profile?.upgrade_modal_seen_at ?? null,
  }
}

export async function getStudentEntitlements(
  userId: string,
  supabase: SupabaseClient = createClient()
): Promise<Entitlements> {
  const [{ data: user }, { data: profile }, { data: bookings }] =
    await Promise.all([
      supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .maybeSingle<{ subscription_status: string }>(),
      supabase
        .from('student_profiles')
        .select(
          'matched_mentor_id, sessions_total, sessions_used, free_session_modal_seen_at, free_session_modal_shows, upgrade_modal_seen_at'
        )
        .eq('user_id', userId)
        .maybeSingle<NonNullable<EntitlementInput['profile']>>(),
      supabase
        .from('session_bookings')
        .select('id, status, starts_at, is_free_trial, free_trial_released_at')
        .eq('student_id', userId)
        .returns<EntitlementBooking[]>(),
    ])

  return computeEntitlements({
    subscriptionStatus: user?.subscription_status ?? null,
    profile: profile ?? null,
    bookings: bookings ?? [],
  })
}

export const FREE_SESSION_MODAL_RESHOW_DAYS = 3
const FREE_SESSION_MODAL_MAX_SHOWS = 2

/**
 * The "first session is on us" modal shows once to students who can book it,
 * and at most once more after FREE_SESSION_MODAL_RESHOW_DAYS if still unbooked.
 */
export function shouldShowFreeSessionModal(
  e: Entitlements,
  now: number = Date.now()
): boolean {
  if (!e.canBookFreeSession) return false
  const { seenAt, shows } = e.freeSessionModal
  if (!seenAt || shows === 0) return true
  if (shows >= FREE_SESSION_MODAL_MAX_SHOWS) return false
  const ageMs = now - new Date(seenAt).getTime()
  return ageMs >= FREE_SESSION_MODAL_RESHOW_DAYS * 24 * 60 * 60 * 1000
}

/** Shown once on the dashboard after the free session is used up. */
export function shouldShowUpgradeModal(e: Entitlements): boolean {
  return (
    e.isMatched &&
    !e.hasPlan &&
    e.freeSession === 'used' &&
    e.upgradeModalSeenAt === null
  )
}
