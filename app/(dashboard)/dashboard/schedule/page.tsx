import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { normalizeOptIns } from '@/lib/scheduling/slots'

import StudentScheduleEditor from './schedule-editor'

export default async function StudentSchedulePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/schedule')
  if (user.role !== 'student') {
    redirect(user.role === 'admin' ? '/admin' : '/mentor')
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('availability_slots, matched_mentor_id')
    .eq('user_id', user.id)
    .maybeSingle<{
      availability_slots: unknown
      matched_mentor_id: string | null
    }>()

  if (!profile) {
    redirect('/onboarding')
  }

  const initialSlotIds = Array.from(normalizeOptIns(profile.availability_slots))

  return (
    <StudentScheduleEditor
      initialSlotIds={initialSlotIds}
      hasMatch={Boolean(profile.matched_mentor_id)}
    />
  )
}
