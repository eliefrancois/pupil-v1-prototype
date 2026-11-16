'use server'

import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/analytics/server'
import { getStudentEntitlements, shouldShowFreeSessionModal } from '@/lib/entitlements'

export async function markFreeSessionModalShown(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const entitlements = await getStudentEntitlements(user.id, supabase)
  if (!shouldShowFreeSessionModal(entitlements)) return

  const shows = entitlements.freeSessionModal.shows + 1
  const { error } = await supabase
    .from('student_profiles')
    .update({
      free_session_modal_seen_at: new Date().toISOString(),
      free_session_modal_shows: shows,
    })
    .eq('user_id', user.id)
  if (error) {
    console.warn('[billing] could not record free session modal:', error.message)
    return
  }

  await captureServerEvent(user.id, 'free_session_modal_shown', { show_number: shows })
}

export async function markUpgradeModalSeen(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('student_profiles')
    .update({ upgrade_modal_seen_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('upgrade_modal_seen_at', null)
  if (error) console.warn('[billing] could not record upgrade modal:', error.message)
}
