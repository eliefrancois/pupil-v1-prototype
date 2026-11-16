import Link from 'next/link'
import { Check, Gift, Shield } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { planFromStatus } from '@/lib/entitlements'
import { isBillingConfigured, PRICE_PER_MONTH_USD } from '@/lib/billing/stripe'

import PricingCta from './pricing-cta'

const features = [
  'Mentor matching within 24 to 48 hours',
  'First session free, no card needed',
  'Up to 24 1:1 sessions per year, about 2 a month',
  'Messaging with your mentor, monitored for safety',
  'Session recordings and transcripts',
  'Session prep and recaps with action items',
  '90-day refund guarantee',
]

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { checkout?: string }
}) {
  const user = await getCurrentUser()
  const plan = user ? planFromStatus(user.subscription_status) : null

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
            <span className="display text-[56px] leading-none">${PRICE_PER_MONTH_USD}</span>
            <span className="text-[16px] font-medium text-text-2">/month</span>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-sm)] bg-primary-soft px-3 py-2.5">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[13px] text-text">
              <span className="font-semibold">Your first session is free.</span>{' '}
              Get matched, message your mentor, and book your first call before
              you pay anything.
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-[14px] text-text">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <PricingCta
              plan={plan}
              billingEnabled={isBillingConfigured()}
              autoCheckout={searchParams.checkout === '1'}
            />
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[12px] text-text-2">
              90-day refund guarantee. If Pupil isn&apos;t working for your
              family, email dario@getpupil.com within 90 days for a full refund.
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
              We offer free access for families who qualify. Applying takes a
              couple of minutes.
            </p>
          </Card>
        </Link>

        <Link href="/schools" className="group">
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
