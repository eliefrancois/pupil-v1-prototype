import crypto from 'node:crypto'

import { NextResponse, type NextRequest } from 'next/server'

import { markEmailsUndeliverable } from '@/lib/email/preferences'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TOLERANCE_SECONDS = 5 * 60

interface ResendEvent {
  type: string
  data?: {
    to?: string[] | string
    bounce?: { type?: string; subType?: string; message?: string }
  }
}

/** Svix signature check (Resend signs webhooks with Svix). */
function verifySignature(body: string, headers: Headers, secret: string): boolean {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatures = headers.get('svix-signature')
  if (!id || !timestamp || !signatures) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest()
  return signatures.split(' ').some((entry) => {
    const [version, signature] = entry.split(',')
    if (version !== 'v1' || !signature) return false
    const given = Buffer.from(signature, 'base64')
    return given.length === expected.length && crypto.timingSafeEqual(given, expected)
  })
}

/**
 * Resend delivery events. Hard bounces and suppressions stop reminder emails
 * to that address; spam complaints count as an unsubscribe.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET is not set.' }, { status: 500 })
  }

  const body = await request.text()
  if (!verifySignature(body, request.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: ResendEvent
  try {
    event = JSON.parse(body) as ResendEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const to = event.data?.to
  const recipients = Array.isArray(to) ? to : to ? [to] : []
  const supabase = createServiceClient()

  if (event.type === 'email.bounced') {
    const bounce = event.data?.bounce
    if (bounce?.type && bounce.type.toLowerCase() !== 'permanent') {
      return NextResponse.json({ ok: true, ignored: 'transient bounce' })
    }
    const reason = ['bounced', bounce?.subType, bounce?.message].filter(Boolean).join(': ')
    await markEmailsUndeliverable(supabase, recipients, reason)
  } else if (event.type === 'email.suppressed') {
    await markEmailsUndeliverable(supabase, recipients, 'suppressed by Resend')
  } else if (event.type === 'email.complained') {
    await markEmailsUndeliverable(supabase, recipients, 'spam complaint', { unsubscribe: true })
  }

  return NextResponse.json({ ok: true })
}
