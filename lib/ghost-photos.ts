/** True when the mentor still has a DiceBear placeholder or no photo. */
export function isPlaceholderMentorPhoto(photoUrl: string | null): boolean {
  if (!photoUrl) return true
  try {
    return new URL(photoUrl).hostname.includes('dicebear.com')
  } catch {
    return false
  }
}

export const GHOST_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp' as const
export const GHOST_PHOTO_MAX_BYTES = 5 * 1024 * 1024

/** PostgREST filter: ghosts still missing photo and/or LinkedIn. */
export const GHOST_PROFILE_QUEUE_OR_FILTER =
  'photo_url.is.null,photo_url.ilike.%dicebear.com%,linkedin_url.is.null'

export function isGhostProfileQueueComplete(
  photoUrl: string | null,
  linkedinUrl: string | null
): boolean {
  return (
    !isPlaceholderMentorPhoto(photoUrl) && Boolean(linkedinUrl?.trim())
  )
}
