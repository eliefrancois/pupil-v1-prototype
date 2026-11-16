import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { createServiceClient } from '@/lib/supabase/service'
import { handleStripeEvent } from '@/lib/billing/webhook'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(body, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error: claimError } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })
  if (claimError) {
    if (claimError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[stripe] could not record event:', claimError.message)
    return NextResponse.json({ error: 'Storage error' }, { status: 500 })
  }

  try {
    await handleStripeEvent(supabase, event)
  } catch (err) {
    console.error(`[stripe] ${event.type} ${event.id} failed:`, err)
    await supabase.from('stripe_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
