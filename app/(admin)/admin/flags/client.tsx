'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  CheckCircle,
  Undo2,
  ShieldAlert,
  User,
  ArrowRight,
  Info,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { resolveFlag } from '@/lib/actions/flag-actions'
import type { FlaggedMessage, FlagStats, ParticipantRole } from './page'

const TAB_OPTIONS = ['Pending', 'Resolved'] as const
type TabOption = (typeof TAB_OPTIONS)[number]

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

const ROLE_LABEL: Record<ParticipantRole, string> = {
  student: 'Student',
  mentor: 'Mentor',
  admin: 'Admin',
  parent: 'Parent',
  unknown: '',
}

function roleLabel(role: ParticipantRole): string {
  return ROLE_LABEL[role] ?? ''
}

// What the strike counter actually triggers today. Kept aligned with
// lib/actions/message-actions.ts so the UI never overpromises. The counter
// has no cap — it keeps climbing past 3, which is why we no longer show
// "X/3" framing.
const STRIKE_TOOLTIP =
  'Each flagged message adds a strike. Threshold is 3: when first crossed, the account is marked under review and an admin is emailed. The user is not auto-suspended — an admin must take action. The count keeps climbing past 3 to preserve signal.'

const STRIKE_THRESHOLD = 3

const ACTION_TOOLTIPS = {
  release:
    'Mark as a false positive. Restores the original message for the recipient, removes the strike from the sender, and clears the flag.',
  confirm:
    'Confirm the flag was correct. The message stays blocked. The strike already added when the message was sent stays on the sender.',
  escalate:
    'Confirm the flag AND immediately suspend the sender\u2019s account (moderation_status = suspended). Use when the violation is severe enough that the user should not keep messaging.',
} as const

const ADMIN_ACTION_BADGE: Record<
  'blocked' | 'released',
  { label: string; variant: 'danger' | 'success' }
> = {
  blocked: { label: 'Blocked', variant: 'danger' },
  released: { label: 'Released (false positive)', variant: 'success' },
}

function PairLabel({ flag }: { flag: FlaggedMessage }) {
  const senderRole = roleLabel(flag.sender_role)
  const recipientRole = roleLabel(flag.recipient_role)
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-gray-600">
      <User className="h-3 w-3 text-gray-400" />
      <span className="font-medium text-gray-900">{flag.sender_name}</span>
      {senderRole && (
        <span className="text-gray-400">({senderRole.toLowerCase()})</span>
      )}
      <ArrowRight className="h-3 w-3 text-gray-400" />
      <span className="font-medium text-gray-900">{flag.recipient_name}</span>
      {recipientRole && (
        <span className="text-gray-400">({recipientRole.toLowerCase()})</span>
      )}
    </div>
  )
}

function FlagBadges({ flag }: { flag: FlaggedMessage }) {
  const config = getTierConfig(flag.flag_tier)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={config.badge}>
        {flag.flag_tier ? `Tier ${flag.flag_tier}` : 'Unclassified'}
      </Badge>
      <Badge variant="default">
        {REASON_LABELS[flag.flag_reason ?? ''] ?? flag.flag_reason ?? 'Flagged'}
      </Badge>
      <span className="text-xs text-gray-400">{formatTime(flag.created_at)}</span>
    </div>
  )
}

function PendingFlagCard({
  flag,
  isPending,
  onAction,
}: {
  flag: FlaggedMessage
  isPending: boolean
  onAction: (id: string, action: 'release' | 'confirm' | 'escalate') => void
}) {
  const config = getTierConfig(flag.flag_tier)
  const status = STATUS_BADGE[flag.sender_status] ?? STATUS_BADGE.active

  return (
    <Card className={cn('overflow-hidden border-l-4', config.border)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <FlagBadges flag={flag} />

            <div className="mt-3">
              <PairLabel flag={flag} />
            </div>

            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-sm text-gray-700">{flag.content}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help items-center gap-1 text-gray-500">
                    Strikes:
                    <span
                      className={cn(
                        'font-bold',
                        flag.sender_strikes >= STRIKE_THRESHOLD
                          ? 'text-red-600'
                          : flag.sender_strikes >= STRIKE_THRESHOLD - 1
                            ? 'text-orange-600'
                            : 'text-gray-700'
                      )}
                    >
                      {flag.sender_strikes}
                    </span>
                    {flag.sender_strikes >= STRIKE_THRESHOLD && (
                      <span className="text-[11px] font-medium text-red-600">
                        · over threshold
                      </span>
                    )}
                    <Info className="h-3 w-3 text-gray-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{STRIKE_TOOLTIP}</TooltipContent>
              </Tooltip>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="soft"
                  className="gap-1.5"
                  onClick={() => onAction(flag.id, 'release')}
                  disabled={isPending}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Release
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {ACTION_TOOLTIPS.release}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="success"
                  className="gap-1.5"
                  onClick={() => onAction(flag.id, 'confirm')}
                  disabled={isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Confirm
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {ACTION_TOOLTIPS.confirm}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="danger"
                  className="gap-1.5"
                  onClick={() => onAction(flag.id, 'escalate')}
                  disabled={isPending}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Escalate
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {ACTION_TOOLTIPS.escalate}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResolvedFlagCard({ flag }: { flag: FlaggedMessage }) {
  const config = getTierConfig(flag.flag_tier)
  const adminAction = flag.admin_action
    ? ADMIN_ACTION_BADGE[flag.admin_action]
    : null

  return (
    <Card className={cn('overflow-hidden border-l-4 opacity-90', config.border)}>
      <CardContent className="p-5">
        <FlagBadges flag={flag} />

        <div className="mt-3">
          <PairLabel flag={flag} />
        </div>

        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-sm text-gray-700">{flag.content}</p>
        </div>

        {adminAction && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Resolution:</span>
            <Badge variant={adminAction.variant}>{adminAction.label}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function FlagsClient({
  pending,
  resolved,
  stats,
}: {
  pending: FlaggedMessage[]
  resolved: FlaggedMessage[]
  stats: FlagStats
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabOption>('Pending')
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function tierMatches(flag: FlaggedMessage): boolean {
    if (activeFilter === 'Tier 1') return flag.flag_tier === 1
    if (activeFilter === 'Tier 2') return flag.flag_tier === 2
    if (activeFilter === 'Tier 3') return flag.flag_tier === 3
    return true
  }

  const filteredPending = pending.filter(
    (flag) => !resolvedIds.has(flag.id) && tierMatches(flag)
  )
  const filteredResolved = resolved.filter(tierMatches)

  function handleAction(messageId: string, action: 'release' | 'confirm' | 'escalate') {
    setActionError(null)
    startTransition(async () => {
      const result = await resolveFlag({ messageId, action })
      if (!result.ok) {
        setActionError(result.error)
        return
      }
      setResolvedIds((prev) => {
        const next = new Set(Array.from(prev))
        next.add(messageId)
        return next
      })
      router.refresh()
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trust & Safety</h1>
          <p className="mt-1 text-sm text-gray-500">
            Flagged messages are auto-blocked from the recipient. Both sender
            and recipient see a policy notice in their thread. Review pending
            flags below and resolve.
          </p>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

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

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {TAB_OPTIONS.map((tab) => {
            const count = tab === 'Pending' ? pending.length - resolvedIds.size : resolved.length
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-[#7A60E4] text-[#7A60E4]'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {tab}
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600">
                  {count}
                </span>
              </button>
            )
          })}
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

        {/* Card list */}
        <div className="space-y-4">
          {activeTab === 'Pending' && filteredPending.length === 0 && (
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

          {activeTab === 'Resolved' && filteredResolved.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Shield className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Nothing resolved yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Past admin decisions will appear here.
              </p>
            </div>
          )}

          {activeTab === 'Pending' &&
            filteredPending.map((flag) => (
              <PendingFlagCard
                key={flag.id}
                flag={flag}
                isPending={isPending}
                onAction={handleAction}
              />
            ))}

          {activeTab === 'Resolved' &&
            filteredResolved.map((flag) => (
              <ResolvedFlagCard key={flag.id} flag={flag} />
            ))}
        </div>
      </div>
    </div>
  )
}
