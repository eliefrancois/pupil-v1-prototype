'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { captureEvent } from '@/lib/analytics/client'
import { startCheckout } from '@/lib/billing/client'
import type { Plan } from '@/lib/entitlements'

const CHECKOUT_INTENT = '/pricing?checkout=1'
const CONTACT_EMAIL = 'dario@getpupil.com'

interface PricingCtaProps {
  plan: Plan | null
  billingEnabled: boolean
  autoCheckout: boolean
}

export default function PricingCta({ plan, billingEnabled, autoCheckout }: PricingCtaProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soon, setSoon] = useState(false)
  const autoStarted = useRef(false)

  const subscribe = useCallback(async () => {
    captureEvent('upgrade_clicked', { source: 'pricing', billing_enabled: billingEnabled })
    if (!billingEnabled) {
      setSoon(true)
      return
    }
    setPending(true)
    setError(null)
    const result = await startCheckout('/pricing')
    if (result.ok) {
      window.location.href = result.url
      return
    }
    setPending(false)
    if (result.code === 'billing_not_configured') setSoon(true)
    else if (result.code === 'unauthenticated') {
      window.location.href = `/login?next=${encodeURIComponent(CHECKOUT_INTENT)}`
    } else setError(result.error)
  }, [billingEnabled])

  useEffect(() => {
    if (!autoCheckout || plan !== 'none' || autoStarted.current) return
    autoStarted.current = true
    window.history.replaceState(null, '', '/pricing')
    void subscribe()
  }, [autoCheckout, plan, subscribe])

  if (plan === null) {
    return (
      <>
        <Button size="lg" className="w-full" asChild>
          <Link href={`/signup?next=${encodeURIComponent(CHECKOUT_INTENT)}`}>
            Subscribe for $99/month
          </Link>
        </Button>
        <p className="mt-3 text-center text-[12px] text-text-2">
          Or{' '}
          <Link href="/signup" className="text-primary hover:underline">
            start free
          </Link>{' '}
          and book your first session on us.{' '}
          <Link
            href={`/login?next=${encodeURIComponent(CHECKOUT_INTENT)}`}
            className="text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </>
    )
  }

  if (plan === 'subscribed' || plan === 'free_access') {
    return (
      <>
        <Button size="lg" className="w-full" disabled>
          {plan === 'subscribed' ? "You're subscribed" : 'You have free access'}
        </Button>
        {plan === 'subscribed' && (
          <p className="mt-3 text-center text-[12px] text-text-2">
            <Link href="/dashboard/settings" className="text-primary hover:underline">
              Manage billing in settings
            </Link>
          </p>
        )}
      </>
    )
  }

  if (soon) {
    return (
      <div className="rounded-[var(--radius)] border border-primary-light bg-primary-soft p-5 text-center">
        <p className="text-[15px] font-semibold text-text">Subscriptions open soon</p>
        <p className="mt-1 text-[13px] text-text-2">
          We&apos;re finishing up payments. Email Dario and he&apos;ll get you set
          up, usually within a day. Your first session is still free.
        </p>
        <Button className="mt-4" asChild>
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Subscribing to Pupil')}`}>
            <Mail />
            Email Dario
          </a>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={subscribe} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Opening checkout
          </>
        ) : (
          'Subscribe for $99/month'
        )}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-center text-[13px] text-danger">
          {error}
        </p>
      )}
    </>
  )
}
