import Stripe from 'stripe'

export const PRICE_PER_MONTH_USD = 99
export const BILLING_CONTACT_EMAIL = 'dario@getpupil.com'

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key ? new Stripe(key) : null
}

export function getPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID || null
}

/** Checkout needs both the secret key and a real recurring price. */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && getPriceId())
}

export type BillingStatus = 'active' | 'inactive'

/**
 * Stripe subscription status to users.subscription_status. past_due keeps
 * access while Stripe retries the card; once retries run out Stripe cancels
 * the subscription (or marks it unpaid) and access ends. incomplete means the
 * first payment hasn't gone through yet, so nothing changes.
 */
export function billingStatusFor(status: Stripe.Subscription.Status): BillingStatus | null {
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
