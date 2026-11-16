export type Plan = 'subscribed' | 'free_access' | 'none'
export type BillingStatus = 'active' | 'inactive'

export type BillingRow = {
  subscription_status: string | null
  stripe_subscription_status?: string | null
  prepaid_access_ends_at?: string | null
}

export const BILLING_COLUMNS =
  'subscription_status, stripe_subscription_status, prepaid_access_ends_at'

/**
 * Stripe subscription status to access. past_due keeps access while Stripe
 * retries the card; once retries run out Stripe cancels the subscription (or
 * marks it unpaid) and access ends. incomplete means the first payment hasn't
 * gone through yet, so it says nothing either way.
 */
export function billingStatusFor(status: string | null | undefined): BillingStatus | null {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return 'active'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'paused':
      return 'inactive'
    default:
      return null
  }
}

export function hasActiveSubscription(row: BillingRow): boolean {
  return billingStatusFor(row.stripe_subscription_status) === 'active'
}

export function prepaidActive(row: BillingRow, now: number = Date.now()): boolean {
  return Boolean(row.prepaid_access_ends_at && Date.parse(row.prepaid_access_ends_at) > now)
}

/**
 * Mirrors public.user_plan(). A prepaid plan past its end date counts as no
 * plan even before the hourly cron flips subscription_status to inactive,
 * unless a Stripe subscription is also keeping access on.
 */
export function planFromBilling(row: BillingRow, now: number = Date.now()): Plan {
  if (row.subscription_status === 'free') return 'free_access'
  if (row.subscription_status !== 'active') return 'none'
  const prepaidExpired = Boolean(row.prepaid_access_ends_at) && !prepaidActive(row, now)
  if (prepaidExpired && !hasActiveSubscription(row)) return 'none'
  return 'subscribed'
}

/**
 * The users.subscription_status a row should have given its Stripe data, or
 * null to leave it alone. 'free' is never touched, and rows with neither a
 * known subscription state nor a prepaid plan keep whatever an admin set.
 */
export function deriveSubscriptionStatus(
  row: BillingRow,
  now: number = Date.now()
): BillingStatus | null {
  if (row.subscription_status === 'free') return null
  const subscription = billingStatusFor(row.stripe_subscription_status)
  if (subscription === 'active' || prepaidActive(row, now)) return 'active'
  if (subscription === 'inactive' || row.prepaid_access_ends_at) return 'inactive'
  return null
}
