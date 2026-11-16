export type AnalyticsEvent =
  | 'student_signed_up'
  | 'student_onboarding_completed'
  | 'mentor_signed_up'
  | 'match_request_created'
  | 'mentor_assigned'
  | 'first_message_sent'
  | 'session_booked'
  | 'checkout_started'
  | 'mentor_profile_claimed'
  | 'eligibility_application_submitted'

export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

const URL_PROPERTIES = [
  '$current_url',
  '$pathname',
  '$referrer',
  '$initial_current_url',
  '$initial_pathname',
  '$initial_referrer',
  '$prev_pageview_pathname',
] as const

const TOKEN_PATH = /\/(mentor-claim|mentor-optout)\/[^/?#]+/g

/** Claim/opt-out links carry one-time tokens in the path; never ship those to PostHog. */
export function sanitizeUrl(value: string): string {
  const withoutHash = value.split('#')[0]
  const [base, query] = withoutHash.split('?')
  const path = base.replace(TOKEN_PATH, '/$1/:token')
  if (!query) return path
  const params = new URLSearchParams(query)
  for (const key of Array.from(params.keys())) {
    if (/token|code|session_id|access|key/i.test(key)) params.set(key, 'redacted')
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export function sanitizeUrlProperties(props: Record<string, unknown> | undefined) {
  if (!props) return
  for (const key of URL_PROPERTIES) {
    const value = props[key]
    if (typeof value === 'string') props[key] = sanitizeUrl(value)
  }
}
