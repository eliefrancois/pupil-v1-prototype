import { run, POPULAR_DOMAINS } from '@zootools/email-spell-checker'

const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const TLD = /^[a-z]{2,}$/i

const SUGGESTION_DOMAINS = Array.from(
  new Set([
    ...POPULAR_DOMAINS,
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'me.com',
    'aol.com',
    'live.com',
    'msn.com',
    'protonmail.com',
  ])
)

const PRIMARY_TLDS = ['com', 'edu', 'org', 'net', 'gov', 'us']

const KNOWN_TLDS = [
  ...PRIMARY_TLDS,
  'io',
  'me',
  'info',
  'co.uk',
  'uk',
  'ca',
  'mx',
  'es',
  'fr',
  'de',
  'nl',
  'in',
  'au',
  'br',
  'jp',
]

const GLUED_TLD = /^([a-z0-9-]{2,})(com|edu|org|net|gov)$/i

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Returns a user-facing error, or null when the address looks deliverable. */
export function validateEmail(raw: string): string | null {
  const email = raw.trim()
  if (!email) return 'Enter an email address.'
  if (/\s/.test(email)) return 'Email addresses can\u2019t contain spaces.'

  const parts = email.split('@')
  if (parts.length !== 2) {
    return parts.length < 2
      ? 'That email is missing an @.'
      : 'That email has more than one @.'
  }

  const [local, domain] = parts
  if (!local) return 'That email is missing the part before the @.'
  if (!domain) return 'That email is missing the part after the @.'
  if (!domain.includes('.')) {
    return 'That email is missing a dot after the @, like name@school.org.'
  }

  const labels = domain.split('.')
  const tld = labels[labels.length - 1]
  if (!labels.every((l) => DOMAIN_LABEL.test(l)) || !TLD.test(tld)) {
    return 'That email doesn\u2019t end in a real domain, like .com or .org.'
  }

  return null
}

export function isValidEmail(raw: string): boolean {
  return validateEmail(raw) === null
}

/** Suggests a corrected address for common domain typos, or null. */
export function suggestEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  const at = email.lastIndexOf('@')
  if (at <= 0 || /\s/.test(email)) return null

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (!domain) return null

  if (!domain.includes('.')) {
    const glued = domain.match(GLUED_TLD)
    if (!glued) return null
    const fixed = `${local}@${glued[1]}.${glued[2]}`
    return suggestEmail(fixed) ?? fixed
  }

  const tld = domain.slice(domain.indexOf('.') + 1)
  const suggestion = run({
    email,
    domains: SUGGESTION_DOMAINS,
    topLevelDomains: KNOWN_TLDS.includes(tld) ? KNOWN_TLDS : PRIMARY_TLDS,
  })
  if (!suggestion || suggestion.full === email) return null
  return suggestion.full
}
