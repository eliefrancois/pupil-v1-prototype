import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/analytics/server'
import { safeNextPath } from '@/lib/auth/safe-next'
import { getPriceId, getStripe } from '@/lib/billing/stripe'
import { BILLING_COLUMNS, planFromBilling, type BillingRow } from '@/lib/billing/access'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const priceId = getPriceId()
  if (!stripe || !priceId) {
    return NextResponse.json(
      {
        error: "Subscriptions aren't open yet. Email dario@getpupil.com and we'll get you set up.",
        code: 'billing_not_configured',
      },
      { status: 503 }
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated', code: 'unauthenticated' }, { status: 401 })
  }

  const { data: row } = await supabase
    .from('users')
    .select(`email, stripe_customer_id, ${BILLING_COLUMNS}`)
    .eq('id', user.id)
    .maybeSingle<BillingRow & { email: string; stripe_customer_id: string | null }>()

  if (row && planFromBilling(row) !== 'none') {
    return NextResponse.json(
      { error: 'You already have access.', code: 'already_subscribed' },
      { status: 409 }
    )
  }

  let returnPath = '/pricing'
  try {
    const body = (await request.json()) as { returnPath?: unknown }
    if (typeof body.returnPath === 'string') {
      returnPath = safeNextPath(body.returnPath) ?? returnPath
    }
  } catch {}

  const origin =
    request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const customerEmail = row?.email ?? user.email

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      ...(row?.stripe_customer_id
        ? {
            customer: row.stripe_customer_id,
            customer_update: { address: 'auto' as const, name: 'auto' as const },
          }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      billing_address_collection: 'required',
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnPath}`,
    })

    await captureServerEvent(user.id, 'checkout_started', {
      stripe_session_id: session.id,
      return_path: returnPath,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] session create failed:', err)
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.', code: 'stripe_error' },
      { status: 502 }
    )
  }
}
