/**
 * A same-origin path to redirect to after auth, or null. Rejects absolute
 * URLs, protocol-relative `//host`, backslash tricks, and control characters.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null
  if (/[\u0000-\u001f\\]/.test(raw)) return null
  return raw
}
