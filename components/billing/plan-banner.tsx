import Link from 'next/link'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Entitlements } from '@/lib/entitlements'

import UpgradeButton from './upgrade-button'
import type { MentorSummary, UpgradeSource } from './upgrade-dialog'

interface PlanBannerProps {
  entitlements: Entitlements
  mentor: MentorSummary | null
  billingEnabled: boolean
  source: UpgradeSource
  autoOpenUpgrade?: boolean
}

/** The one plan nudge for a matched student without a plan. Renders nothing otherwise. */
export default function PlanBanner({
  entitlements,
  mentor,
  billingEnabled,
  source,
  autoOpenUpgrade = false,
}: PlanBannerProps) {
  if (!entitlements.isMatched || entitlements.hasPlan) return null
  const name = mentor?.firstName ?? 'your mentor'

  if (entitlements.canBookFreeSession) {
    return (
      <BannerCard
        icon={<Gift className="h-4 w-4" />}
        title={`Your first session with ${name} is free`}
        body="30 minutes on video, at a time that works for you. No card needed."
        action={
          <Button size="sm" asChild>
            <Link href="/dashboard/book">
              Book my free session
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />
    )
  }

  if (entitlements.freeSession === 'booked') return null

  return (
    <BannerCard
      icon={<Sparkles className="h-4 w-4" />}
      title={`Keep going with ${name}`}
      body="Subscribe for $99/month to book up to 24 sessions a year. Messaging stays free."
      action={
        <UpgradeButton
          size="sm"
          mentor={mentor}
          billingEnabled={billingEnabled}
          source={source}
          autoOpen={autoOpenUpgrade}
          recordAutoOpen={autoOpenUpgrade}
        >
          See the plan
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </UpgradeButton>
      }
    />
  )
}

function BannerCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <Card accent className="border-primary-light bg-primary-soft">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white">
            {icon}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text">{title}</p>
            <p className="mt-0.5 text-[13px] text-text-2">{body}</p>
          </div>
        </div>
        <div className="sm:shrink-0">{action}</div>
      </div>
    </Card>
  )
}
