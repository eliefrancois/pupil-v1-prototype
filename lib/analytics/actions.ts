'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type AnalyticsTraits = { role: string; account_class?: string }

/** Returns the caller's own role and account class for PostHog person properties. */
export async function getAnalyticsTraits(): Promise<AnalyticsTraits | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data } = await createServiceClient()
      .from('admin_user_classification')
      .select('role, account_class')
      .eq('user_id', user.id)
      .maybeSingle<{ role: string; account_class: string }>()
    if (data) return { role: data.role, account_class: data.account_class }
  } catch (err) {
    console.warn('[analytics] account class lookup failed:', err)
  }

  const { data: row } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  return row ? { role: row.role } : null
}
