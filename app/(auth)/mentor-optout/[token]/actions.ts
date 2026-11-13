'use server'

import { revalidatePath } from 'next/cache'

import { createServiceClient } from '@/lib/supabase/service'

/**
 * Takes an unclaimed imported profile off the public directory and stops
 * claim emails. 'unreachable' keeps it out of public_mentor_profiles and out
 * of the claim campaign.
 */
export async function removeImportedProfile(formData: FormData) {
  const token = formData.get('token')
  if (typeof token !== 'string' || !token) return

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('mentor_profiles')
    .select('user_id')
    .eq('claim_optout_token', token)
    .in('claim_status', ['ghost', 'claim_pending'])
    .maybeSingle<{ user_id: string }>()
  if (!profile) return

  await supabase
    .from('mentor_profiles')
    .update({ status: 'paused', claim_status: 'unreachable', claim_token: null })
    .eq('user_id', profile.user_id)

  revalidatePath(`/mentor-optout/${token}`)
  revalidatePath('/mentors')
  revalidatePath(`/mentors/${profile.user_id}`)
}
