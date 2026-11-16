import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/analytics/server'
import { getStripe } from '@/lib/billing/stripe'

export const dynamic = 'force-dynamic'

export async function POST() {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Billing isn\u2019t set up yet. Email dario@getpupil.com for help.' },
      { status: 503 }
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: row } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (!row?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'We couldn\u2019t find a billing account for you.' },
      { status: 404 }
    )
  }

  // No configuration or return_url: the account's default portal
  // configuration (set up in Stripe, returns to /dashboard) applies.
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
    })
    await captureServerEvent(user.id, 'billing_portal_opened')
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing] portal session failed:', err)
    return NextResponse.json(
      { error: 'Could not open billing. Please try again.' },
      { status: 502 }
    )
  }
}
