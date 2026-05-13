'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UpgradeBannerProps {
  variant?: 'inline' | 'full'
}

export default function UpgradeBanner({ variant = 'full' }: UpgradeBannerProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-primary-light bg-primary-soft px-4 py-3">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-[13px] text-text">
          Upgrade to book sessions and message your mentor.
        </p>
        <Button size="sm" asChild>
          <Link href="/pricing">
            Upgrade
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Card accent className="bg-primary-soft border-primary-light">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text">
              You&apos;re on the free preview
            </p>
            <p className="mt-0.5 text-[13px] text-text-2">
              Upgrade to book sessions, message your mentor, and unlock 24
              sessions per year.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/access">Free or pilot access</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/pricing">
              Upgrade for $900/year
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
