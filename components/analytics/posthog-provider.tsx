'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

import { getAnalyticsTraits } from '@/lib/analytics/actions'
import { POSTHOG_HOST, sanitizeUrlProperties } from '@/lib/analytics/events'
import { createClient } from '@/lib/supabase/client'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const TRAITS_SESSION_KEY = 'pupil_ph_identified'

function uiHostFor(apiHost: string) {
  if (apiHost.includes('eu.i.posthog.com')) return 'https://eu.posthog.com'
  if (apiHost.includes('us.i.posthog.com')) return 'https://us.posthog.com'
  return apiHost
}

function initPostHog() {
  if (!POSTHOG_KEY || posthog.__loaded) return
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',
    ui_host: uiHostFor(POSTHOG_HOST),
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    respect_dnt: true,
    disable_session_recording: true,
    session_recording: { maskAllInputs: true, maskTextSelector: '*' },
    autocapture: { element_allowlist: ['a', 'button', 'form', 'label'] },
    mask_all_element_attributes: true,
    before_send: (event) => {
      if (!event) return null
      sanitizeUrlProperties(event.properties)
      sanitizeUrlProperties(event.$set)
      sanitizeUrlProperties(event.$set_once)
      return event
    },
  })
}

async function identifyFromSession(userId: string) {
  const identifiedAs = sessionStorage.getItem(TRAITS_SESSION_KEY)
  if (identifiedAs === userId) return
  if (identifiedAs) posthog.reset()
  const traits = await getAnalyticsTraits().catch(() => null)
  if (!traits) return
  posthog.identify(userId, traits)
  sessionStorage.setItem(TRAITS_SESSION_KEY, userId)
}

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
    if (!posthog.__loaded || !pathname) return
    const qs = searchParams.toString()
    posthog.capture('$pageview', {
      $current_url: `${window.location.origin}${pathname}${qs ? `?${qs}` : ''}`,
    })
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!POSTHOG_KEY) return
    initPostHog()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(TRAITS_SESSION_KEY)
        posthog.reset()
        return
      }
      const userId = session?.user?.id
      if (!userId) return
      // Supabase warns against awaiting other calls inside this callback.
      setTimeout(() => void identifyFromSession(userId), 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      {POSTHOG_KEY && (
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
      )}
      {children}
    </>
  )
}
