import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

import { captureServerEvent } from '@/lib/analytics/server'

import { billingStatusFor, deriveSubscriptionStatus } from './access'

type BillingUser = {
  id: string
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  prepaid_access_ends_at: string | null
}

const USER_COLS =
  'id, subscription_status, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, prepaid_access_ends_at'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const PREPAID_MONTHS_KEY = 'pupil_access_months'
export const PREPAID_PLAN_KEY = 'pupil_plan'
const MAX_PREPAID_MONTHS = 120

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

/** Calendar months in UTC, clamped to the last day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const day = date.getUTCDate()
  const result = new Date(date)
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

async function findUser(
  supabase: SupabaseClient,
  keys: {
    userId?: string | null
    subscriptionId?: string | null
    customerId?: string | null
    email?: string | null
  }
): Promise<BillingUser | null> {
  const lookups: [string, string | null | undefined][] = [
    ['id', keys.userId && UUID.test(keys.userId) ? keys.userId : null],
    ['stripe_subscription_id', keys.subscriptionId],
    ['stripe_customer_id', keys.customerId],
    ['email', keys.email?.trim().toLowerCase()],
  ]
  for (const [column, value] of lookups) {
    if (!value) continue
    const { data, error } = await supabase
      .from('users')
      .select(USER_COLS)
      .eq(column, value)
      .maybeSingle<BillingUser>()
    if (error) throw new Error(`[stripe] user lookup by ${column} failed: ${error.message}`)
    if (data) return data
  }
  return null
}

type UserPatch = {
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string
  sessionId?: string | null
  prepaid?: { endsAt: string; plan: string | null }
}

async function updateUser(
  supabase: SupabaseClient,
  user: BillingUser,
  patch: UserPatch,
  context: Record<string, unknown>
): Promise<void> {
  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (patch.customerId) update.stripe_customer_id = patch.customerId
  if (patch.subscriptionId) update.stripe_subscription_id = patch.subscriptionId
  if (patch.subscriptionStatus) update.stripe_subscription_status = patch.subscriptionStatus
  if (patch.sessionId) update.stripe_session_id = patch.sessionId
  if (patch.prepaid) {
    update.prepaid_access_ends_at = patch.prepaid.endsAt
    if (patch.prepaid.plan) update.prepaid_plan = patch.prepaid.plan
  }

  const status = deriveSubscriptionStatus({
    subscription_status: user.subscription_status,
    stripe_subscription_status: patch.subscriptionStatus ?? user.stripe_subscription_status,
    prepaid_access_ends_at: patch.prepaid?.endsAt ?? user.prepaid_access_ends_at,
  })
  const statusChanged = status !== null && status !== user.subscription_status
  if (statusChanged) update.subscription_status = status

  const { error } = await supabase.from('users').update(update).eq('id', user.id)
  if (error) throw new Error(`[stripe] user update failed: ${error.message}`)

  if (statusChanged) {
    await captureServerEvent(
      user.id,
      status === 'active' ? 'subscription_activated' : 'subscription_canceled',
      context
    )
  }
}

type PrepaidGrant = { months: number; plan: string | null }

/** The longest pupil_access_months on the session's line item prices, if any. */
async function prepaidGrantFor(stripe: Stripe, sessionId: string): Promise<PrepaidGrant | null> {
  const full = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price'],
  })
  let grant: PrepaidGrant | null = null
  for (const item of full.line_items?.data ?? []) {
    const metadata = item.price?.metadata ?? {}
    const months = Number(metadata[PREPAID_MONTHS_KEY])
    if (!Number.isInteger(months) || months < 1 || months > MAX_PREPAID_MONTHS) continue
    if (!grant || months > grant.months) {
      grant = { months, plan: metadata[PREPAID_PLAN_KEY] || null }
    }
  }
  return grant
}

/**
 * Subscription checkouts turn access on. One-time checkouts (mode=payment)
 * need `prepaid` to look up the price metadata; without it they're skipped,
 * so only the webhook grants prepaid access.
 */
export async function applyCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  prepaid?: { stripe: Stripe | null; paidAt: Date }
): Promise<{ userId: string | null }> {
  if (session.status !== 'complete') return { userId: null }
  if (session.mode !== 'subscription' && session.mode !== 'payment') return { userId: null }
  if (session.mode === 'payment' && !prepaid) return { userId: null }

  const user = await findUser(supabase, {
    userId: session.client_reference_id ?? session.metadata?.user_id,
    customerId: idOf(session.customer),
    email: session.customer_details?.email ?? session.customer_email,
  })
  if (!user) {
    console.warn(`[stripe] checkout ${session.id} has no matching Pupil user`)
    return { userId: null }
  }

  const paid =
    session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const base = { customerId: idOf(session.customer), sessionId: session.id }

  if (session.mode === 'subscription') {
    const subscriptionId = idOf(session.subscription)
    await updateUser(
      supabase,
      user,
      {
        ...base,
        subscriptionId,
        subscriptionStatus: paid && subscriptionId ? 'active' : undefined,
      },
      { source: 'checkout', mode: session.mode }
    )
    return { userId: user.id }
  }

  if (!prepaid || !paid) return { userId: user.id }
  if (!prepaid.stripe) {
    throw new Error('[stripe] STRIPE_SECRET_KEY is needed to read one-time checkout line items')
  }

  const grant = await prepaidGrantFor(prepaid.stripe, session.id)
  if (!grant) {
    console.warn(
      `[stripe] one-time checkout ${session.id} has no ${PREPAID_MONTHS_KEY} price metadata; access unchanged`
    )
    await updateUser(supabase, user, base, { source: 'payment' })
    return { userId: user.id }
  }

  const endsAt = addMonths(prepaid.paidAt, grant.months)
  const currentEnd = user.prepaid_access_ends_at ? Date.parse(user.prepaid_access_ends_at) : 0
  await updateUser(
    supabase,
    user,
    {
      ...base,
      prepaid: {
        endsAt: new Date(Math.max(endsAt.getTime(), currentEnd)).toISOString(),
        plan: grant.plan,
      },
    },
    { source: 'prepaid', plan: grant.plan, months: grant.months }
  )
  return { userId: user.id }
}

async function applySubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  deleted: boolean
): Promise<void> {
  const user = await findUser(supabase, {
    userId: subscription.metadata?.user_id,
    subscriptionId: subscription.id,
    customerId: idOf(subscription.customer),
  })
  if (!user) {
    console.warn(`[stripe] subscription ${subscription.id} has no matching Pupil user`)
    return
  }

  const subscriptionStatus = deleted ? 'canceled' : subscription.status

  // An older subscription ending must not cut off a newer one.
  const isOtherSubscription =
    user.stripe_subscription_id !== null && user.stripe_subscription_id !== subscription.id
  if (isOtherSubscription && billingStatusFor(subscriptionStatus) !== 'active') return

  await updateUser(
    supabase,
    user,
    {
      customerId: idOf(subscription.customer),
      subscriptionId: subscription.id,
      subscriptionStatus,
    },
    { source: 'subscription', stripe_status: deleted ? 'deleted' : subscription.status }
  )
}

function invoiceSubscription(invoice: Stripe.Invoice) {
  const details = invoice.parent?.subscription_details
  return {
    subscriptionId: idOf(details?.subscription),
    userId: details?.metadata?.user_id ?? null,
  }
}

async function applyInvoicePaid(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
): Promise<void> {
  const { subscriptionId, userId } = invoiceSubscription(invoice)
  if (!subscriptionId) return

  const user = await findUser(supabase, {
    userId,
    subscriptionId,
    customerId: idOf(invoice.customer),
  })
  if (!user) {
    console.warn(`[stripe] invoice ${invoice.id} has no matching Pupil user`)
    return
  }

  await updateUser(
    supabase,
    user,
    {
      customerId: idOf(invoice.customer),
      subscriptionId,
      subscriptionStatus: 'active',
    },
    { source: 'invoice' }
  )
}

async function recordPaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
): Promise<void> {
  const { subscriptionId, userId } = invoiceSubscription(invoice)
  const user = await findUser(supabase, {
    userId,
    subscriptionId,
    customerId: idOf(invoice.customer),
  })
  if (!user) return
  await captureServerEvent(user.id, 'payment_failed', {
    attempt_count: invoice.attempt_count,
  })
}

export async function handleStripeEvent(
  supabase: SupabaseClient,
  event: Stripe.Event,
  stripe: Stripe | null
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await applyCheckoutSession(supabase, event.data.object, {
        stripe,
        paidAt: new Date(event.created * 1000),
      })
      return
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await applySubscription(supabase, event.data.object, false)
      return
    case 'customer.subscription.deleted':
      await applySubscription(supabase, event.data.object, true)
      return
    case 'invoice.paid':
      await applyInvoicePaid(supabase, event.data.object)
      return
    case 'invoice.payment_failed':
      await recordPaymentFailed(supabase, event.data.object)
      return
  }
}
