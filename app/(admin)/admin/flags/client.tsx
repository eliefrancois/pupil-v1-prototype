'use client'

import { useState, useTransition } from 'react'
import {
  Shield,
  CheckCircle,
  Undo2,
  AlertTriangle,
  ShieldAlert,
  User,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { resolveFlag } from '@/lib/actions/flag-actions'
import type { FlaggedMessage, FlagStats } from './page'

const FILTER_OPTIONS = ['All', 'Tier 1', 'Tier 2', 'Tier 3'] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

function formatTime(iso: string): string {
  const d = new Date(iso)
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'America/New_York' })
  const day = d.toLocaleString('en-US', { day: 'numeric', timeZone: 'America/New_York' })
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
  return `${month} ${day}, ${time}`
}

const TIER_CONFIG: Record<number, {
  label: string
  border: string
  badge: 'secondary' | 'warning' | 'danger'
}> = {
  1: { label: 'Tier 1 — Profanity', border: 'border-l-yellow-400', badge: 'warning' },
  2: { label: 'Tier 2 — Bigotry / Contact', border: 'border-l-orange-500', badge: 'danger' },
  3: { label: 'Tier 3 — Sexual Content', border: 'border-l-red-600', badge: 'danger' },
}

function getTierConfig(tier: number | null) {
  if (tier && TIER_CONFIG[tier]) return TIER_CONFIG[tier]
  return { label: 'Unclassified', border: 'border-l-gray-300', badge: 'secondary' as const }
}

const REASON_LABELS: Record<string, string> = {
  profanity: 'Profanity',
  bigotry: 'Bigotry',
  external_contact: 'External Contact',
  sexual_content: 'Sexual Content',
}

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  under_review: { label: 'Under Review', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'danger' },
}

export default function FlagsClient({
  flags,
  stats,
}: {
  flags: FlaggedMessage[]
  stats: FlagStats
}) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const filteredFlags = flags.filter((flag) => {
    if (resolvedIds.has(flag.id)) return false
    if (activeFilter === 'Tier 1') return flag.flag_tier === 1
    if (activeFilter === 'Tier 2') return flag.flag_tier === 2
    if (activeFilter === 'Tier 3') return flag.flag_tier === 3
    return true
  })

  function handleAction(messageId: string, action: 'release' | 'confirm' | 'escalate') {
    startTransition(async () => {
      await resolveFlag({ messageId, action })
      setResolvedIds((prev) => {
        const next = new Set(Array.from(prev))
        next.add(messageId)
        return next
      })
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Safety flags</h1>
          <p className="mt-1 text-sm text-gray-500">
            All flagged messages are auto-blocked from recipients. Review and resolve below.
          </p>
        </div>

        {/* Aggregate stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-white px-4 py-3">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Pending review</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3">
            <p className="text-2xl font-bold text-yellow-600">{stats.tier1}</p>
            <p className="text-xs text-gray-500">Tier 1 — Profanity</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3">
            <p className="text-2xl font-bold text-orange-600">{stats.tier2}</p>
            <p className="text-xs text-gray-500">Tier 2 — Bigotry / Contact</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3">
            <p className="text-2xl font-bold text-red-700">{stats.tier3}</p>
            <p className="text-xs text-gray-500">Tier 3 — Sexual</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveFilter(option)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeFilter === option
                  ? 'bg-[#7A60E4] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Flag cards */}
        <div className="space-y-4">
          {filteredFlags.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">All clear</p>
              <p className="mt-1 text-xs text-gray-500">
                No flagged messages need review.
              </p>
            </div>
          )}

          {filteredFlags.map((flag) => {
            const config = getTierConfig(flag.flag_tier)
            const status = STATUS_BADGE[flag.sender_status] ?? STATUS_BADGE.active
            return (
              <Card
                key={flag.id}
                className={cn('overflow-hidden border-l-4', config.border)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Tier + reason badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={config.badge}>
                          {flag.flag_tier ? `Tier ${flag.flag_tier}` : 'Unclassified'}
                        </Badge>
                        <Badge variant="default">
                          {REASON_LABELS[flag.flag_reason ?? ''] ?? flag.flag_reason ?? 'Flagged'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatTime(flag.created_at)}
                        </span>
                      </div>

                      {/* Message content */}
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-sm text-gray-700">{flag.content}</p>
                      </div>

                      {/* Sender info bar */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-gray-700">{flag.sender_name}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          Strikes:
                          <span className={cn(
                            'font-bold',
                            flag.sender_strikes >= 3 ? 'text-red-600' : flag.sender_strikes >= 2 ? 'text-orange-600' : 'text-gray-700'
                          )}>
                            {flag.sender_strikes}/3
                          </span>
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        size="sm"
                        variant="soft"
                        className="gap-1.5"
                        onClick={() => handleAction(flag.id, 'release')}
                        disabled={isPending}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Release
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        className="gap-1.5"
                        onClick={() => handleAction(flag.id, 'confirm')}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="gap-1.5"
                        onClick={() => handleAction(flag.id, 'escalate')}
                        disabled={isPending}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
