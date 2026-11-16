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