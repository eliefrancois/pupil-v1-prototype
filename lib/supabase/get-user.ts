import { createClient } from '@/lib/supabase/server'
import type { CurrentUser } from '@/hooks/use-current-user'

/**
 * Fetches the current authenticated user (auth + public.users row) on the
 * server so initial HTML reflects auth state with no flash.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data } = await supabase
    .from('users')
    .select(
      'id, email, full_name, role, subscription_status, onboarding_complete'
    )
    .eq('id', authUser.id)
    .single<CurrentUser>()

  return data ?? null
}
