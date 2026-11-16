'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, CreditCard, Gift, Video } from 'lucide-react'

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
import { markFreeSessionModalShown } from '@/lib/actions/billing-actions'

import type { MentorSummary } from './upgrade-dialog'

export default function FreeSessionDialog({ mentor }: { mentor: MentorSummary }) {
  const [open, setOpen] = useState(true)
  const recorded = useRef(false)

  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    void markFreeSessionModalShown()
  }, [])

  const bullets = [
    { icon: Video, text: `A 30-minute video call with ${mentor.firstName}` },
    { icon: CalendarClock, text: 'Pick a time that works for you' },
    { icon: CreditCard, text: 'No card needed' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onClose={() => setOpen(false)}
        className="max-h-[calc(100dvh-2rem)] max-w-md gap-0 overflow-y-auto p-0"
      >
        <div className="relative overflow-hidden rounded-t-[var(--radius-lg)] bg-primary-soft px-6 pb-6 pt-8 text-center">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full text-primary-light"
            viewBox="0 0 400 200"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="40" cy="30" r="60" fill="currentColor" />
            <circle cx="370" cy="170" r="80" fill="currentColor" />
            <circle cx="330" cy="40" r="10" fill="currentColor" />
            <circle cx="70" cy="160" r="6" fill="currentColor" />
          </svg>
          <div className="relative mx-auto w-fit">
            <Avatar
              src={mentor.photoUrl}
              alt={mentor.fullName}
              className="h-20 w-20 text-xl shadow-sm ring-4 ring-surface"
            />
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary-soft"
            >
              <Gift className="h-4 w-4" />
            </span>
          </div>
          <DialogHeader className="relative mt-4 items-center space-y-2 text-center">
            <DialogTitle className="display text-[28px] font-normal leading-tight">
              Your first session is on us
            </DialogTitle>
            <DialogDescription className="max-w-xs text-[14px]">
              {mentor.school
                ? `${mentor.firstName} from ${mentor.school} is ready to meet you.`
                : `${mentor.firstName} is ready to meet you.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-6">
          <ul className="space-y-3">
            {bullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[14px] text-text">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Maybe later
            </Button>
            <Button asChild>
              <Link href="/dashboard/book" onClick={() => setOpen(false)}>
                Book my free session
              </Link>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
