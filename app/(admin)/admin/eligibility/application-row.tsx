'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheck as CheckCircle, Circle as XCircle, Mail } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import {
  approveEligibilityApplication,
  denyEligibilityApplication,
} from './actions'

export type EligibilityApplicationItem = {
  id: string
  student_name: string
  parent_name: string | null
  email: string
  student_email: string | null
  grade: number | null
  school: string | null
  eligibility_type: string
  counselor_email: string | null
  counselor_status: string | null
  counselor_emailed_at: string | null
  status: 'pending' | 'approved' | 'denied' | null
  granted_user_id: string | null
  created_at: string | null
  reviewed_at: string | null
}

const STATUS_VARIANT = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
} as const

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ApplicationRow({
  app,
}: {
  app: EligibilityApplicationItem
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  )

  const status = app.status ?? 'pending'
  const needsAccountLink = status === 'approved' && !app.granted_user_id

  const run = (action: (id: string) => ReturnType<typeof denyEligibilityApplication>) =>
    startTransition(async () => {
      const res = await action(app.id)
      setFeedback(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error })
      if (res.ok) router.refresh()
    })

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {app.student_name}
            </h3>
            {app.grade && (
              <span className="text-xs text-gray-500">Grade {app.grade}</span>
            )}
            {app.school && (
              <span className="text-xs text-gray-400">{app.school}</span>
            )}
            <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
          </div>

          <div className="mt-1.5 space-y-1 text-xs text-gray-500">
            <p className="flex flex-wrap items-center gap-x-2">
              <Mail className="h-3.5 w-3.5" />
              {app.parent_name ? `${app.parent_name} · ` : ''}
              {app.email}
              {app.student_email && <span>· Student: {app.student_email}</span>}
            </p>
            <p>
              Counselor: {app.counselor_email ?? 'none'}
              {' · '}
              {app.counselor_emailed_at
                ? `emailed ${formatDate(app.counselor_emailed_at)}`
                : 'email not sent'}
            </p>
            <p>
              Submitted {formatDate(app.created_at)}
              {app.reviewed_at && ` · Reviewed ${formatDate(app.reviewed_at)}`}
              {needsAccountLink && ' · No student account linked yet'}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="default">{app.eligibility_type}</Badge>
            <Badge
              variant={app.counselor_status === 'confirmed' ? 'success' : 'secondary'}
            >
              Counselor {app.counselor_status ?? 'pending'}
            </Badge>
          </div>

          {feedback && (
            <p
              className={`mt-3 text-xs ${
                feedback.ok ? 'text-green-700' : 'text-red-600'
              }`}
            >
              {feedback.text}
            </p>
          )}
        </div>

        {(status === 'pending' || needsAccountLink) && (
          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
            <Button
              size="sm"
              variant="success"
              className="gap-1.5"
              disabled={pending}
              onClick={() => run(approveEligibilityApplication)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {needsAccountLink ? 'Check again' : 'Approve'}
            </Button>
            {status === 'pending' && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                disabled={pending}
                onClick={() => run(denyEligibilityApplication)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Deny
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
