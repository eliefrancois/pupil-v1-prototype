'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ResolveFlagResult = { ok: true } | { ok: false; error: string }

/**
 * Admin action to resolve a flagged message.
 *
 * - release: false positive. Unblock message, decrement sender's strike,
 *   restore original content so recipient can see it.
 * - confirm: AI was correct. Mark as reviewed, keep blocked.
 * - escalate: confirm + suspend the sender's account immediately.
 */
export async function resolveFlag(input: {
  messageId: string
  action: 'release' | 'confirm' | 'escalate'
}): Promise<ResolveFlagResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Admin access required.' }
  }

  // Fetch the flagged message to get sender_id and original_content
  const { data: message } = await supabase
    .from('messages')
    .select('id, sender_id, original_content')
    .eq('id', input.messageId)
    .single<{ id: string; sender_id: string; original_content: string | null }>()

  if (!message) return { ok: false, error: 'Message not found.' }

  switch (input.action) {
    case 'release': {
      // Restore original content, unblock, unflag
      const { error } = await supabase
        .from('messages')
        .update({
          content: message.original_content ?? undefined,
          is_flagged: false,
          is_modified: false,
          admin_action: 'released',
          original_content: null,
        })
        .eq('id', input.messageId)
      if (error) return { ok: false, error: error.message }

      // Decrement strike (floor at 0)
      await supabase.rpc('decrement_moderation_strikes', {
        target_user_id: message.sender_id,
      })
      break
    }

    case 'confirm': {
      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: false,
          admin_action: 'blocked',
        })
        .eq('id', input.messageId)
      if (error) return { ok: false, error: error.message }
      break
    }

    case 'escalate': {
      // Confirm the flag
      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: false,
          admin_action: 'blocked',
        })
        .eq('id', input.messageId)
      if (error) return { ok: false, error: error.message }

      // Suspend the sender
      await supabase
        .from('users')
        .update({ moderation_status: 'suspended' })
        .eq('id', message.sender_id)
      break
    }
  }

  revalidatePath('/admin/flags')
  return { ok: true }
}
