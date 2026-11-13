import { NextResponse, type NextRequest } from 'next/server'

import { runClaimCampaign } from '@/lib/matching/claim-campaign'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEFAULT_DAILY_LIMIT = 75

/**
 * Daily claim-campaign run, triggered by Vercel Cron (see vercel.json).
 * Sends nothing unless CLAIM_CAMPAIGN_ENABLED=true; otherwise it reports who
 * would be emailed or hidden.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set.' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedLimit = Number(process.env.CLAIM_CAMPAIGN_DAILY_LIMIT)
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_DAILY_LIMIT

  try {
    const result = await runClaimCampaign({
      live: process.env.CLAIM_CAMPAIGN_ENABLED === 'true',
      limit,
    })
    console.log(
      `[claim-campaign] ${result.mode}: due=${result.due.length} sent=${result.sent} failed=${result.failed} hidden=${result.hidden}`
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[claim-campaign] run failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
