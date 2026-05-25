/** Canonical production URL for customer-facing links in emails. */
export const CANONICAL_SITE_URL = 'https://www.getpupil.com'

/**
 * Base site URL for emails and outbound links.
 * Vercel preview domains must never appear in customer emails.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!raw) return CANONICAL_SITE_URL
  if (raw.includes('.vercel.app')) return CANONICAL_SITE_URL
  return raw
}

export function mentorProfileUrl(mentorUserId: string): string {
  return `${getSiteUrl()}/mentors/${mentorUserId}`
}
