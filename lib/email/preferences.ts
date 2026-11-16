import type { SupabaseClient } from '@supabase/supabase-js'

import { getSiteUrl } from '@/lib/site-url'

export async function getUnsubscribeToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  await supabase
    .from('email_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
  const { data, error } = await supabase
    .from('email_preferences')
    .select('unsubscribe_token')
    .eq('user_id', userId)
    .single<{ unsubscribe_token: string }>()
  if (error || !data) throw new Error(error?.message ?? 'No email preferences row')
  return data.unsubscribe_token
}

export function unsubscribeUrls(token: string) {
  const site = getSiteUrl()
  return {
    page: `${site}/unsubscribe?token=${token}`,
    oneClick: `${site}/api/email/unsubscribe?token=${token}`,
  }
}

export async function setUnsubscribed(
  supabase: SupabaseClient,
  token: string,
  unsubscribed: boolean
): Promise<boolean> {
  const { data, error } = await supabase
    .from('email_preferences')
    .update({
      unsubscribed_at: unsubscribed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .select('user_id')
  return !error && (data?.length ?? 0) > 0
}

/** Stops reminder emails to every account using one of these addresses. */
export async function markEmailsUndeliverable(
  supabase: SupabaseClient,
  emails: string[],
  reason: string,
  { unsubscribe = false }: { unsubscribe?: boolean } = {}
): Promise<number> {
  const normalized = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)))
  if (normalized.length === 0) return 0

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .in('email', normalized)
    .returns<{ id: string; email: string }[]>()
  if (error || !users?.length) return 0

  const now = new Date().toISOString()
  const { error: upsertError } = await supabase.from('email_preferences').upsert(
    users.map((u) => ({
      user_id: u.id,
      ...(unsubscribe ? { unsubscribed_at: now } : { email_bounced_at: now }),
      bounce_reason: reason.slice(0, 500),
      updated_at: now,
    })),
    { onConflict: 'user_id' }
  )
  return upsertError ? 0 : users.length
}
