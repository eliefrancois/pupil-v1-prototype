import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('payment_method_types[0]', 'card')
  params.append('line_items[0][price]', process.env.STRIPE_PRICE_ID || 'price_pupil_early_access')
  params.append('line_items[0][quantity]', '1')
  params.append('success_url', `${origin}/success?session_id={CHECKOUT_SESSION_ID}`)
  params.append('cancel_url', `${origin}/pricing`)
  params.append('customer_email', user.email || '')
  params.append('client_reference_id', user.id)
  params.append('metadata[user_id]', user.id)

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: session.error?.message || 'Failed to create checkout session' },
        { status: 400 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
