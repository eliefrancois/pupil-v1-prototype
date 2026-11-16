import { POSTHOG_HOST, type AnalyticsEvent } from '@/lib/analytics/events'

/**
 * Server-side capture over PostHog's HTTP API. Awaited by callers because
 * serverless functions can be frozen once the response is sent; the timeout
 * keeps a slow PostHog from holding up the user.
 */
export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties: Record<string, unknown> = {}
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return

  try {
    await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'pupil-server' },
        timestamp: new Date().toISOString(),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
  } catch (err) {
    console.warn(`[analytics] ${event} capture failed:`, err)
  }
}
