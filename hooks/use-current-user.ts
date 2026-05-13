'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export type SubscriptionStatus = 'active' | 'inactive' | 'free'

export type CurrentUser = {
  id: string
  email: string
  full_name: string
  role: 'student' | 'mentor' | 'admin' | 'parent'
  subscription_status: SubscriptionStatus
  onboarding_complete: boolean
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, role, subscription_status, onboarding_complete')
        .eq('id', authUser.id)
        .single<CurrentUser>()

      if (mounted) {
        setUser(data ?? null)
        setLoading(false)
      }
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, isPaid: user?.subscription_status !== 'inactive' }
}
