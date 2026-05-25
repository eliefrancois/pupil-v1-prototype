/** True when the value is not a real college name (status text, year-only, etc.). */
export function isWeakUniversityLabel(university: string | null | undefined): boolean {
  const t = (university ?? '').trim()
  if (!t || t === '.' || t === '—' || t === '-') return true
  if (/^\d{4}$/.test(t)) return true
  if (/^(n\/a|na|none|tbd)$/i.test(t)) return true
  if (/anticipated to complete/i.test(t)) return true
  if (/currently in progress/i.test(t)) return true
  if (/^in progress\b/i.test(t)) return true
  if (/^anticipated$/i.test(t)) return true
  return false
}

const SCHOOL_PREFIX_PATTERNS = [
  /^anticipated\s*[-–]\s*/i,
  /^currently\s+attending\s+/i,
  /^currently\s+enrolled\s+at\s+/i,
  /^attending\s+/i,
  /^enrolled\s+at\s+/i,
  /^student\s+at\s+/i,
]

/** Remove CSV status prefixes so "attending uc berkeley" → "uc berkeley". */
export function stripSchoolPrefix(label: string): string {
  let s = label.trim()
  for (const pattern of SCHOOL_PREFIX_PATTERNS) {
    s = s.replace(pattern, '').trim()
  }
  return s
}

/** Light cleanup for informal school strings (e.g. "uc berkeley" → "UC Berkeley"). */
export function formatSchoolName(label: string): string {
  const t = stripSchoolPrefix(label).trim()
  if (!t) return t

  const ucMatch = t.match(/^uc\s+(.+)$/i)
  if (ucMatch) {
    const rest = ucMatch[1]
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    return `UC ${rest}`
  }

  if (t.length < 48 && !/\b(university|college|institute)\b/i.test(t)) {
    return t
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  return t
}

/**
 * Best college name for ops UI + LinkedIn. Falls back through profile + CSV
 * fields; strips status prefixes ("attending", "anticipated -", etc.).
 */
export function resolveGhostMentorSchool(params: {
  university?: string | null
  csv_raw?: Record<string, unknown> | null
}): string | null {
  const candidates: string[] = []
  if (params.university?.trim()) candidates.push(params.university.trim())

  const raw = params.csv_raw
  if (raw && typeof raw === 'object') {
    if (typeof raw.graduate === 'string' && raw.graduate.trim()) {
      candidates.push(raw.graduate.trim())
    }
    if (typeof raw.bachelors === 'string' && raw.bachelors.trim()) {
      candidates.push(raw.bachelors.trim())
    }
  }

  for (const candidate of candidates) {
    const school = formatSchoolName(candidate)
    if (school && !isWeakUniversityLabel(school)) return school
  }

  return null
}

/**
 * Resolve a ghost mentor's full name for admin ops. CSV import often leaves
 * users.full_name empty while csv_raw or the DiceBear seed still has the name.
 */
export function resolveGhostMentorFullName(params: {
  full_name?: string | null
  email?: string | null
  csv_raw?: Record<string, unknown> | null
  photo_url?: string | null
}): string {
  const fromUser = (params.full_name ?? '').trim()
  if (fromUser) return fromUser

  const raw = params.csv_raw
  if (raw && typeof raw === 'object') {
    if (typeof raw.full_name === 'string' && raw.full_name.trim()) {
      return raw.full_name.trim()
    }
    const first =
      typeof raw.first_name === 'string' ? raw.first_name.trim() : ''
    const last = typeof raw.last_name === 'string' ? raw.last_name.trim() : ''
    const combined = `${first} ${last}`.trim()
    if (combined) return combined
  }

  if (params.photo_url) {
    try {
      const seed = new URL(params.photo_url).searchParams.get('seed')
      if (seed) {
        return decodeURIComponent(seed).replace(/-/g, ' ').trim()
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return ''
}

/** Email from users row or ghost CSV import payload. */
export function resolveGhostMentorEmail(params: {
  email?: string | null
  csv_raw?: Record<string, unknown> | null
}): string {
  const fromUser = (params.email ?? '').trim()
  if (fromUser) return fromUser

  const raw = params.csv_raw
  if (raw && typeof raw === 'object') {
    if (typeof raw.email_lower === 'string' && raw.email_lower.trim()) {
      return raw.email_lower.trim()
    }
    if (typeof raw.email === 'string' && raw.email.trim()) {
      return raw.email.trim()
    }
  }

  return ''
}

/** Hometown from ghost CSV import (city / state on the raw row or identity block). */
export function resolveGhostMentorLocation(params: {
  csv_raw?: Record<string, unknown> | null
  identity_json?: Record<string, unknown> | null
}): { city: string | null; state: string | null } {
  const fromPair = (cityVal: unknown, stateVal: unknown) => {
    const city = typeof cityVal === 'string' ? cityVal.trim() : ''
    const state = typeof stateVal === 'string' ? stateVal.trim() : ''
    if (!city && !state) return null
    return { city: city || null, state: state || null }
  }

  const raw = params.csv_raw
  if (raw && typeof raw === 'object') {
    const direct = fromPair(raw.city, raw.state)
    if (direct) return direct

    const identity = raw.identity
    if (identity && typeof identity === 'object' && !Array.isArray(identity)) {
      const loc = (identity as Record<string, unknown>).location
      if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
        const nested = fromPair(
          (loc as Record<string, unknown>).city,
          (loc as Record<string, unknown>).state
        )
        if (nested) return nested
      }
    }
  }

  const idJson = params.identity_json
  if (idJson && typeof idJson === 'object') {
    const loc = idJson.location
    if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
      const nested = fromPair(
        (loc as Record<string, unknown>).city,
        (loc as Record<string, unknown>).state
      )
      if (nested) return nested
    }
  }

  return { city: null, state: null }
}

export function formatGhostMentorLocation(
  city: string | null,
  state: string | null
): string {
  return [city, state].filter(Boolean).join(', ')
}
