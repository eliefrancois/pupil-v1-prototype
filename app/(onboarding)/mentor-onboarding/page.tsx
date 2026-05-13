import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { getColleges, getMajors } from '@/lib/data/colleges-majors'

import MentorOnboardingForm, {
  type ExistingProfile,
} from './onboarding-form'

export default async function MentorOnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mentor-onboarding')

  if (user.role !== 'mentor') {
    redirect(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  const supabase = createClient()
  const [{ data: profile }, colleges, majors] = await Promise.all([
    supabase
      .from('mentor_profiles')
      .select(
        'university, major, college_id, major_id, grad_year, year_in_school, bio, photo_url, linkedin_url, tags, timezone, availability_schedule, max_mentees, commitment, motivations, identity_json, status, submitted_at'
      )
      .eq('user_id', user.id)
      .maybeSingle<ExistingProfile>(),
    getColleges(),
    getMajors(),
  ])

  if (profile?.status && profile.status !== 'pending' && profile.submitted_at) {
    redirect('/mentor')
  }

  return (
    <MentorOnboardingForm
      userId={user.id}
      fullName={user.full_name ?? ''}
      email={user.email}
      existingProfile={profile ?? null}
      colleges={colleges}
      majors={majors}
    />
  )
}
