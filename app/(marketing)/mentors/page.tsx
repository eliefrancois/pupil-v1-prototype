import { createClient } from '@/lib/supabase/server'
import type { PublicMentor } from '@/lib/types/mentor'

import MentorDirectory from './mentor-directory'

export const metadata = {
  title: 'Browse Mentors | Pupil',
  description:
    'Browse Pupil mentors. Real students at top universities ready to guide your college journey.',
}

export const revalidate = 60

export default async function MentorsPage() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('public_mentor_profiles')
    .select('*')
    .order('rating', { ascending: false })

  if (error) {
    console.error('Failed to load mentors', error)
  }

  const mentors = (data ?? []) as PublicMentor[]

  return <MentorDirectory mentors={mentors} />
}
