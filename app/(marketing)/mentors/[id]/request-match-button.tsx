'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader as Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createMatchRequest } from '@/lib/actions/match-request-actions'

const MESSAGE_MAX_CHARS = 500

type ViewerState =
  | { kind: 'guest' }
  | { kind: 'student'; alreadyRequested: boolean }
  | { kind: 'mentor' } // can't request other mentors
  | { kind: 'admin' }

interface RequestMatchButtonProps {
  mentorId: string
  mentorDisplayName: string
  mentorIsGhost: boolean
  viewer: ViewerState
}

/**
 * Auth-aware "Request match" CTA on the mentor detail page.
 *
 * - Guest: sends them to /signup with a return path back here.
 * - Student (no prior request): opens a quick message modal, submits via
 *   server action, shows confirmation.
 * - Student (already requested): shows the requested-state pill.
 * - Mentor or admin: shows nothing (they don't request matches).
 */
export default function RequestMatchButton({
  mentorId,
  mentorDisplayName,
  mentorIsGhost,
  viewer,
}: RequestMatchButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (viewer.kind === 'mentor' || viewer.kind === 'admin') {
    return null
  }

  if (viewer.kind === 'guest') {
    // Honor the existing ?next pattern used by /login. Signup doesn't read
    // ?next today, but adding the param now keeps the URL forward-compatible
    // for when we deep-link the post-onboarding redirect.
    const returnTo = `/mentors/${mentorId}`
    return (
      <div className="mt-8 rounded-[var(--radius)] border border-primary-light bg-primary-soft p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text">
                Want to work with {firstName(mentorDisplayName)}?
              </p>
              <p className="text-[13px] text-text-2">
                Sign up free, then request a match. Our team handles the
                intro.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/login?next=${encodeURIComponent(returnTo)}`}>
                Log in
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/signup?next=${encodeURIComponent(returnTo)}`}>
                Sign up to request
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Student
  if (viewer.alreadyRequested) {
    return (
      <div className="mt-8 rounded-[var(--radius)] border border-border bg-bg-2 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(16,185,129,0.1)] text-success">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text">
              Request sent
            </p>
            <p className="text-[13px] text-text-2">
              We&apos;ll reach out as soon as an admin reviews it. You can
              track it on your dashboard.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await createMatchRequest({ mentorId, message })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(true)
    // Soft refresh so the page re-reads the new request state on close.
    router.refresh()
  }

  return (
    <>
      <div className="mt-8 rounded-[var(--radius)] border border-primary-light bg-primary-soft p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text">
                Request to be matched with {firstName(mentorDisplayName)}
              </p>
              <p className="text-[13px] text-text-2">
                {mentorIsGhost
                  ? `${firstName(mentorDisplayName)} hasn't been onboarded yet. If you request, we'll reach out and set it up.`
                  : `Our team will review and send the intro within a few days.`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="sm:shrink-0"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Request match
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !submitting && !success && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius)] bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)] text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="display text-[20px]">Request sent</h3>
                <p className="mt-2 text-[14px] text-text-2">
                  We&apos;ll review and reach out within a few days. You can
                  track this on your dashboard.
                </p>
                <div className="mt-6 flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setOpen(false)
                      setSuccess(false)
                      setMessage('')
                    }}
                  >
                    Keep browsing
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/dashboard">View dashboard</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="display text-[20px]">
                      Request {firstName(mentorDisplayName)}
                    </h3>
                    <p className="mt-1 text-[13px] text-text-2">
                      Tell us a bit about what you want help with. Optional
                      but it helps us match faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="rounded-full p-1 text-text-3 transition-colors hover:bg-bg-2 hover:text-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {error && (
                  <div className="mb-3 rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
                    {error}
                  </div>
                )}

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_CHARS))}
                  placeholder={`e.g. I'm applying to schools like ${truncate(mentorDisplayName, 18)}'s and want help with essays.`}
                  rows={4}
                  className="resize-none"
                />
                <p className="mt-1 text-right text-[11px] text-text-3">
                  {message.length} / {MESSAGE_MAX_CHARS}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Send request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function firstName(s: string): string {
  return s.trim().split(/\s+/)[0] ?? s
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}.` : s
}
