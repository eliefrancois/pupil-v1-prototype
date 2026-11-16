import { unstable_cache } from 'next/cache'

import { createServiceClient } from '@/lib/supabase/service'

/**
 * Hand-picked mentors for the homepage, in display order. Only approved,
 * claimed profiles with a photo are shown, so imported (ghost) profiles
 * never appear here even if their id is added by mistake.
 */
const FEATURED_MENTOR_IDS = [
  '08d1c1e1-22d9-44f9-9769-1ba177e320e9',
  '8e14cfbd-3818-4a83-bc95-99480253c7ff',
  '4d7a1538-212f-4338-89d1-ca66d80de611',
  'e7becf6b-635f-41a2-8546-e5afa7e9aa2e',
]

export type FeaturedMentor = {
  id: string
  displayName: string
  firstName: string
  university: string
  major: string | null
  photoUrl: string
}

type FeaturedRow = {
  user_id: string
  university: string
  major: string | null
  photo_url: string | null
  users: { full_name: string } | null
}

/** Mirrors public_mentor_profiles.display_name: "First L." */
function toDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName.trim()
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

async function loadFeaturedMentors(): Promise<FeaturedMentor[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(
      'user_id, university, major, photo_url, users:users!mentor_profiles_user_id_fkey!inner(full_name)'
    )
    .in('user_id', FEATURED_MENTOR_IDS)
    .eq('status', 'approved')
    .eq('claim_status', 'claimed')
    .not('photo_url', 'is', null)
    .returns<FeaturedRow[]>()

  if (error) throw error

  return FEATURED_MENTOR_IDS.flatMap((id) => {
    const row = data?.find((r) => r.user_id === id)
    if (!row?.photo_url || !row.users) return []
    const displayName = toDisplayName(row.users.full_name)
    return [
      {
        id: row.user_id,
        displayName,
        firstName: displayName.split(' ')[0],
        university: row.university,
        major: row.major,
        photoUrl: row.photo_url,
      },
    ]
  })
}

const loadFeaturedMentorsCached = unstable_cache(
  loadFeaturedMentors,
  ['featured-mentors'],
  { revalidate: 3600 }
)

export async function getFeaturedMentors(): Promise<FeaturedMentor[]> {
  try {
    return await loadFeaturedMentorsCached()
  } catch (err) {
    console.error('Failed to load featured mentors', err)
    return []
  }
}
