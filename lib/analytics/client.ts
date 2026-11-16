'use client'

import posthog from 'posthog-js'

import type { AnalyticsEvent } from '@/lib/analytics/events'

export type AnalyticsRole = 'student' | 'mentor' | 'admin' | 'parent'

export function captureEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}

/** Person properties stay non-identifying: no email or name (many users are minors). */
export function identifyUser(
  userId: string,
  traits: { role: AnalyticsRole | string; account_class?: string }
) {
  if (!posthog.__loaded) return
  posthog.identify(userId, traits)
}
