'use client'

import { useState, useTransition } from 'react'
import {
  AlertCircle,
  Check,
  Clock,
  Loader as Loader2,
  MailCheck,
  Send,
  Sparkles,
  X,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import {
  declineRequest,
  forwardRequest,
  sendClaimEmail,
} from './actions'

export interface RequestRowData {
  id: string
  status: string
  studentMessage: string | null
  requestedAt: string
  forwardedAt: string | null
  decidedAt: string | null
  declineReason: string | null
  student: {
    id: string
    name: string
    email: string
    grade: number | null
    interests: string[]
    colleges: string[]
  }
  mentor: {
    id: string
    name: string
    email: string
    university: string
    claimStatus: 'ghost' | 'claimed' | null
    claimEmailSentAt: string | null
  }
}

export default function RequestRow({ row }: { row: RequestRowData }) {
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<null | 'forward' | 'claim' | 'decline'>(null)
  const [error, setError] = useState('')
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [success, setSuccess] = useState<null | 'forwarded' | 'claimed' | 'declined'>(null)

  const isGhost = row.mentor.claimStatus === 'ghost'
  const canAct = row.status === 'pending'

  function run(action: 'forward' | 'claim' | 'decline', fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError('')
    setBusy(action)
    startTransition(async () => {
      const result = await fn()
      setBusy(null)
      if (!result.ok) {
        setError(result.error ?? 'Action failed.')
        return
      }
      if (action === 'forward') setSuccess('forwarded')
      else if (action === 'claim') setSuccess('claimed')
      else if (action === 'decline') setSuccess('declined')
    })
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-text">
                {row.student.name}
              </h3>
              <span className="text-text-3">→</span>
              <h3 className="text-[15px] font-semibold text-text">
                {row.mentor.name}
              </h3>
              {isGhost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bg-2 px-2 py-0.5 text-[11px] font-medium text-text-2 border border-border">
                  <Sparkles className="h-2.5 w-2.5" />
                  Ghost
                </span>
              )}
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-1 text-[12px] text-text-3">
              {timeAgo(row.requestedAt)}
              {row.mentor.university ? ` · ${row.mentor.university}` : null}
              {row.student.grade ? ` · student in grade ${row.student.grade}` : null}
            </p>
          </div>
        </div>

        {(row.student.interests.length > 0 || row.student.colleges.length > 0) && (
          <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-3 text-[12px]">
            {row.student.interests.length > 0 && (
              <p>
                <span className="font-medium text-text">Interests:</span>{' '}
                <span className="text-text-2">
                  {row.student.interests.slice(0, 6).join(', ')}
                  {row.student.interests.length > 6 && ` (+${row.student.interests.length - 6})`}
                </span>
              </p>
            )}
            {row.student.colleges.length > 0 && (
              <p className="mt-1">
                <span className="font-medium text-text">Target colleges:</span>{' '}
                <span className="text-text-2">
                  {row.student.colleges.slice(0, 4).join(', ')}
                  {row.student.colleges.length > 4 && ` (+${row.student.colleges.length - 4})`}
                </span>
              </p>
            )}
          </div>
        )}

        {row.studentMessage && (
          <div className="rounded-[var(--radius-sm)] border-l-2 border-primary bg-primary-soft px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-3">
              Student message
            </p>
            <p className="mt-1 text-[13px] text-text">{row.studentMessage}</p>
          </div>
        )}

        {row.status === 'declined' && row.declineReason && (
          <div className="rounded-[var(--radius-sm)] border-l-2 border-[#B91C1C] bg-[rgba(239,68,68,0.05)] px-3 py-2 text-[12px] text-text-2">
            <span className="font-medium text-text">Decline reason:</span>{' '}
            {row.declineReason}
          </div>
        )}

        {isGhost && row.mentor.claimEmailSentAt && (
          <p className="text-[11px] text-text-3">
            <MailCheck className="mr-1 inline-block h-3 w-3" />
            Claim email last sent {timeAgo(row.mentor.claimEmailSentAt)}
          </p>
        )}

        {error && (
          <div className="rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-[var(--radius-sm)] border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] p-3 text-[13px] text-success">
            {success === 'forwarded' && `Forwarded to ${row.mentor.name}. Email sent.`}
            {success === 'claimed' && `Claim email sent to ${row.mentor.email}.`}
            {success === 'declined' && `Marked declined. Student notified.`}
          </div>
        )}

        {canAct && !success && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isGhost ? (
              <Button
                size="sm"
                onClick={() =>
                  run('claim', () => sendClaimEmail(row.mentor.id, row.id))
                }
                disabled={!!busy || pending}
              >
                {busy === 'claim' ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MailCheck className="mr-1.5 h-3.5 w-3.5" />
                    Send claim email
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => run('forward', () => forwardRequest(row.id))}
                disabled={!!busy || pending}
              >
                {busy === 'forward' ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Forward to mentor
                  </>
                )}
              </Button>
            )}

            {!showDeclineForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeclineForm(true)}
                disabled={!!busy || pending}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Decline
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 p-3">
                <p className="text-[12px] font-medium text-text">
                  Decline reason (optional, goes to student)
                </p>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value.slice(0, 400))}
                  placeholder="e.g. This mentor isn't taking new mentees right now."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeclineForm(false)
                      setDeclineReason('')
                    }}
                    disabled={!!busy || pending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      run('decline', () =>
                        declineRequest(row.id, declineReason || null)
                      )
                    }
                    disabled={!!busy || pending}
                  >
                    {busy === 'decline' ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Declining...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Confirm decline
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <Badge variant="warning">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    )
  }
  if (status === 'forwarded') {
    return (
      <Badge variant="secondary">
        <Send className="mr-1 h-3 w-3" />
        Forwarded
      </Badge>
    )
  }
  if (status === 'accepted') return <Badge variant="success">Accepted</Badge>
  if (status === 'declined') {
    return (
      <Badge variant="warning" className="bg-[rgba(239,68,68,0.1)] text-[#B91C1C]">
        <AlertCircle className="mr-1 h-3 w-3" />
        Declined
      </Badge>
    )
  }
  if (status === 'expired') return <Badge variant="secondary">Expired</Badge>
  if (status === 'cancelled') return <Badge variant="secondary">Cancelled</Badge>
  return <Badge>{status}</Badge>
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const ms = Date.now() - t
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
