import { isWeakUniversityLabel } from '@/lib/ghost-mentor-name'

/** Normalize mentor LinkedIn input to a canonical profile URL, or null if empty. */
export function normalizeLinkedinUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^linkedin\.com/i.test(trimmed)) return `https://${trimmed}`
  if (/^www\.linkedin\.com/i.test(trimmed)) {
    return `https://${trimmed.replace(/^www\./i, '')}`
  }
  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, '')}`
}

/** LinkedIn people search: mentor name + college only (no major / grad year). */
export function buildLinkedinPeopleSearchUrl(params: {
  fullName: string
  university?: string | null
}): string {
  const parts: string[] = []
  const name = params.fullName.trim()
  if (name) parts.push(name)

  const uni = (params.university ?? '').trim()
  if (uni && !isWeakUniversityLabel(uni)) parts.push(uni)

  const keywords = parts.join(' ').trim() || name || uni || 'mentor'
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`
}
