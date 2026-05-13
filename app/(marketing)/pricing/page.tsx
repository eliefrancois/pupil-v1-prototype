'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Loader as Loader2, Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  'Mentor matching within 24 to 48 hours',
  'Up to 24 1:1 sessions per year',
  'In-app messaging monitored for safety',
  'Session recordings and transcripts',
  'Pre-call icebreakers tailored to your student',
  'Post-call breakdowns with action items',
  '90-day refund guarantee',
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const { user, isPaid, loading: userLoading } = useCurrentUser()

  const handleCheckout = async () => {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      window.location.href = '/signup?next=/pricing'
      return
    }

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
        alert(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setLoading(false)
      alert('Something went wrong. Please try again.')
    }
  }

  const ctaLabel = !user
    ? 'Sign up free, then upgrade'
    : isPaid
      ? "You're already a member"
      : 'Upgrade for $900/year'

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <p className="tiny text-primary">Early access pricing</p>
        <h1 className="display mt-3 text-[36px] sm:text-[44px]">
          Invest in your student&rsquo;s{' '}
          <em className="italic font-normal">future.</em>
        </h1>
      </div>

      <Card accent className="mt-12 border-2 border-primary p-8 shadow-lg sm:p-10">
        <CardContent className="p-0">
          <Badge variant="default">Early Access</Badge>

          <div className="mt-6">
            <span className="display text-[56px] leading-none">$900</span>
            <span className="text-[16px] font-medium text-text-2">/year</span>
          </div>
          <p className="mt-1 text-[13px] text-text-3">$75/month equivalent</p>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-[14px] text-text">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              disabled={loading || userLoading || isPaid}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                ctaLabel
              )}
            </Button>
            {!user && !userLoading && (
              <p className="mt-3 text-center text-[12px] text-text-2">
                <Link href="/login" className="text-primary hover:underline">
                  Already have an account? Log in
                </Link>
              </p>
            )}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[12px] text-text-2">
              90-day refund guarantee if we can&apos;t match you and get your
              first session scheduled within 90 days.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/access" className="group">
          <Card hover className="h-full p-6">
            <h3 className="text-[15px] font-semibold text-text transition-colors group-hover:text-primary">
              Need free access?
            </h3>
            <p className="mt-2 text-[13px] text-text-2">
              We offer free access for families who qualify. Check your
              eligibility or enter a pilot code.
            </p>
          </Card>
        </Link>

        <Link href="/access" className="group">
          <Card hover className="h-full p-6">
            <h3 className="text-[15px] font-semibold text-text transition-colors group-hover:text-primary">
              School or organization?
            </h3>
            <p className="mt-2 text-[13px] text-text-2">
              We work with schools and community-based organizations through
              bulk access codes.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
