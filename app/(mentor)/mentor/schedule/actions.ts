'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { serializeOptIns } from '@/lib/scheduling/slots'

export type SaveAvailabilityResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Persist a mentor's canonical-slot opt-ins.
 * Caller passes string ids in the `${day}-${slot}` form.
 */
export async function saveMentorAvailability(
  slotIds: string[]
): Promise<SaveAvailabilityResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const cleaned = serializeOptIns(slotIds)

  const { error } = await supabase
    .from('mentor_profiles')
    .update({ availability_slots: cleaned })
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/mentor/schedule')
  revalidatePath('/mentor')
  return { ok: true }
}
