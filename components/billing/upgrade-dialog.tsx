'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, Mail, Shield, Sparkles } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { captureEvent } from '@/lib/analytics/client'
import { startCheckout } from '@/lib/billing/client'

export type UpgradeSource = 'dashboard' | 'book' | 'mentor' | 'settings'

export type MentorSummary = {
  firstName: string
  fullName: string
  photoUrl: string | null
  school: string | null
}

const CONTACT_EMAIL = 'dario@getpupil.com'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentor: MentorSummary | null
  billingEnabled: boolean
  source: UpgradeSource
  returnPath: string
}

export default function UpgradeDialog({
  open,
  onOpenChange,
  mentor,
  billingEnabled,
  source,
  returnPath,
}: UpgradeDialogProps) {
  const [view, setView] = useState<'offer' | 'soon'>('offer')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    if (open && !tracked.current) {
      tracked.current = true
      captureEvent('upgrade_modal_shown', { source })
    }
    if (!open) {
      tracked.current = false
      setView('offer')
      setError(null)
    }
  }, [open, source])

  const name = mentor?.firstName || 'your mentor'

  async function handleSubscribe() {
    captureEvent('upgrade_clicked', { source, billing_enabled: billingEnabled })
    if (!billingEnabled) {
      setView('soon')
      return
    }
    setPending(true)
    setError(null)
    const result = await startCheckout(returnPath)
    if (result.ok) {
      window.location.href = result.url
      return
    }
    setPending(false)
    if (result.code === 'billing_not_configured') {
      setView('soon')
    } else if (result.code === 'unauthenticated') {
      window.location.href = `/login?next=${encodeURIComponent(returnPath)}`
    } else {
      setError(result.error)
    }
  }

  const close = () => {
    if (!pending) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent
        onClose={close}
        className="max-h-[calc(100dvh-2rem)] max-w-md gap-0 overflow-y-auto p-0"
      >
        {view === 'offer' ? (
          <>
            <div className="relative flex flex-col items-center rounded-t-[var(--radius-lg)] bg-primary-soft px-6 pb-6 pt-8 text-center">
              <div className="relative">
                <Avatar
                  src={mentor?.photoUrl}
                  alt={mentor?.fullName || 'Your mentor'}
                  className="h-16 w-16 text-lg shadow-sm ring-4 ring-surface"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary-soft"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              </div>
              <DialogHeader className="mt-4 items-center space-y-2 text-center">
                <DialogTitle className="display text-[26px] font-normal leading-tight">
                  Keep going with {name}
                </DialogTitle>
                <DialogDescription className="max-w-xs text-[14px]">
                  Subscribe to keep meeting with {name} and stay on track with
                  your college plans.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="display text-[44px] leading-none">$99</span>
                <span className="text-[15px] font-medium text-text-2">/month</span>
              </div>

              <ul className="space-y-2.5">
                {[
                  `Up to 24 sessions a year with ${name}`,
                  'Messaging between sessions',
                  'Session prep and recaps',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-text">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-border bg-surface-2 p-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-[12px] leading-relaxed text-text-2">
                  90-day refund guarantee. If Pupil isn&apos;t working for your
                  family, email us for a full refund.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-danger">
                  {error}
                </p>
              )}

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="ghost" onClick={close} disabled={pending}>
                  Not now
                </Button>
                <Button onClick={handleSubscribe} disabled={pending} className="sm:min-w-[140px]">
                  {pending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Opening checkout
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </DialogFooter>

              <p className="text-center text-[12px] text-text-3">
                Need help paying?{' '}
                <Link href="/access" className="text-primary hover:underline">
                  Apply for free access
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <DialogHeader className="mt-4 items-center space-y-2 text-center">
              <DialogTitle className="display text-[24px] font-normal leading-tight">
                Subscriptions open soon
              </DialogTitle>
              <DialogDescription className="max-w-xs text-[14px]">
                We&apos;re finishing up payments. Email Dario and he&apos;ll get you
                set up with {name}, usually within a day.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 w-full gap-2 sm:justify-center">
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
              <Button asChild>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Subscribing to Pupil')}`}
                >
                  Email Dario
                </a>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
