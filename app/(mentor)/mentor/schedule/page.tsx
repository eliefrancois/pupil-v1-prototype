import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { normalizeOptIns } from '@/lib/scheduling/slots'

import ScheduleEditor from './schedule-editor'

export default async function MentorSchedulePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mentor/schedule')
  if (user.role !== 'mentor') {
    redirect(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select('availability_slots, status')
    .eq('user_id', user.id)
    .maybeSingle<{
      availability_slots: unknown
      status: string
    }>()

  if (!profile) {
    redirect('/mentor-onboarding')
  }

  const initialSlotIds = Array.from(normalizeOptIns(profile.availability_slots))

  return (
    <ScheduleEditor
      initialSlotIds={initialSlotIds}
      isApproved={profile.status === 'approved'}
    />
  )
}
