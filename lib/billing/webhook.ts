import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

import { captureServerEvent } from '@/lib/analytics/server'

import { billingStatusFor, type BillingStatus } from './stripe'

type BillingUser = {
  id: string
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

const USER_COLS = 'id, subscription_status, stripe_customer_id, stripe_subscription_id'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
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

async function updateUser(
  supabase: SupabaseClient,
  user: BillingUser,
  patch: {
    status: BillingStatus | null
    customerId?: string | null
    subscriptionId?: string | null
    sessionId?: string | null
  },
  context: Record<string, unknown>
): Promise<void> {
  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (patch.customerId) update.stripe_customer_id = patch.customerId
  if (patch.subscriptionId) update.stripe_subscription_id = patch.subscriptionId
  if (patch.sessionId) update.stripe_session_id = patch.sessionId

  const statusChanged =
    patch.status !== null &&
    user.subscription_status !== 'free' &&
    user.subscription_status !== patch.status
  if (statusChanged && patch.status) update.subscription_status = patch.status

  const { error } = await supabase.from('users').update(update).eq('id', user.id)
  if (error) throw new Error(`[stripe] user update failed: ${error.message}`)

  if (statusChanged) {
    await captureServerEvent(
      user.id,
      patch.status === 'active' ? 'subscription_activated' : 'subscription_canceled',
      context
    )
  }
}

export async function applyCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<{ userId: string | null }> {
  if (session.status !== 'complete') return { userId: null }

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

  await updateUser(
    supabase,
    user,
    {
      status: paid ? 'active' : null,
      customerId: idOf(session.customer),
      subscriptionId: idOf(session.subscription),
      sessionId: session.id,
    },
    { source: 'checkout', mode: session.mode }
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

  const status = deleted ? 'inactive' : billingStatusFor(subscription.status)

  // An older subscription ending must not cut off a newer one.
  const isOtherSubscription =
    user.stripe_subscription_id !== null && user.stripe_subscription_id !== subscription.id
  if (isOtherSubscription && status !== 'active') return

  await updateUser(
    supabase,
    user,
    {
      status,
      customerId: idOf(subscription.customer),
      subscriptionId: subscription.id,
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
    { status: 'active', customerId: idOf(invoice.customer), subscriptionId },
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
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await applyCheckoutSession(supabase, event.data.object)
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
