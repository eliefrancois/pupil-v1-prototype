import { NextResponse, type NextRequest } from 'next/server'

import { setUnsubscribed } from '@/lib/email/preferences'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/** RFC 8058 one-click unsubscribe (Gmail/Yahoo POST here from the List-Unsubscribe header). */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const ok = await setUnsubscribed(createServiceClient(), token, true)
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Unknown token' }, { status: 404 })
}

/** Link scanners prefetch GETs, so a GET only shows the confirm page. */
export function GET(request: NextRequest) {
  const url = new URL('/unsubscribe', request.url)
  const token = request.nextUrl.searchParams.get('token')
  if (token) url.searchParams.set('token', token)
  return NextResponse.redirect(url)
}
