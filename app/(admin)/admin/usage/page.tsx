import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CalendarCheck,
  CreditCard,
  GraduationCap,
  MessageCircle,
  UserCheck,
  Users,
  Handshake,
} from 'lucide-react'

import StatCard from '@/components/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createServiceClient } from '@/lib/supabase/service'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Bucket = 'week' | 'month'

type TrendRow = {
  bucket_start: string
  student_signups: number
  onboarding_completions: number
  mentor_signups: number
  match_requests: number
  messages_sent: number
  sessions_booked: number
}

type UsageMetrics = {
  bucket: Bucket
  headline: {
    total_students: number
    onboarded_students: number
    approved_real_mentors: number
    active_pairs: number
    students_messaged: number
    sessions_completed: number
    paying_subscribers: number
  }
  pairs_by_mentor_class: { mentor_class: string; pairs: number; mentors: number }[]
  trend: TrendRow[]
  funnel: {
    signed_up: number
    onboarded: number
    matched: number
    messaged: number
    booked: number
    completed: number
  }
  claim_campaign: {
    imported: number
    step_0: number
    step_1: number
    step_2: number
    step_3: number
    emailed: number
    claimed: number
    opted_out: number
    hidden: number
    still_ghost: number
  }
  excluded: { account_class: string; role: string; n: number }[]
}

const TREND_SERIES: { key: keyof Omit<TrendRow, 'bucket_start'>; label: string }[] = [
  { key: 'student_signups', label: 'Student signups' },
  { key: 'onboarding_completions', label: 'Onboarding completions' },
  { key: 'mentor_signups', label: 'Mentor signups' },
  { key: 'match_requests', label: 'Match requests' },
  { key: 'messages_sent', label: 'Messages sent' },
  { key: 'sessions_booked', label: 'Sessions booked' },
]

const FUNNEL_STEPS: { key: keyof UsageMetrics['funnel']; label: string }[] = [
  { key: 'signed_up', label: 'Signed up' },
  { key: 'onboarded', label: 'Onboarded' },
  { key: 'matched', label: 'Matched' },
  { key: 'messaged', label: 'Sent first message' },
  { key: 'booked', label: 'Booked a session' },
  { key: 'completed', label: 'Completed a session' },
]

const CLASS_LABELS: Record<string, string> = {
  real: 'Real',
  ghost_import: 'Ghost imports',
  admin: 'Admins',
  internal_demo: 'Internal / demo',
  test: 'Test accounts',
  founder: 'Founders',
  bot: 'Bots',
  unknown: 'Unknown',
}

function formatBucket(iso: string, bucket: Bucket) {
  const d = new Date(iso)
  return bucket === 'month'
    ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function pct(n: number, d: number) {
  if (!d) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: { interval?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/usage')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">Admins only</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bucket: Bucket = searchParams.interval === 'month' ? 'month' : 'week'

  const service = createServiceClient()
  const { data, error } = await service.rpc('admin_usage_metrics', {
    p_bucket: bucket,
  })

  if (error || !data) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">
              Could not load usage metrics
            </p>
            <p className="mt-1 text-[13px] text-text-2">{error?.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = data as UsageMetrics
  const { headline, funnel, claim_campaign: claim } = metrics
  const founderPairs = metrics.pairs_by_mentor_class
    .filter((p) => p.mentor_class !== 'real')
    .reduce((sum, p) => sum + p.pairs, 0)

  const excludedByClass = new Map<string, { total: number; roles: string[] }>()
  for (const row of metrics.excluded) {
    const entry = excludedByClass.get(row.account_class) ?? { total: 0, roles: [] }
    entry.total += row.n
    entry.roles.push(`${row.n} ${row.role}${row.n === 1 ? '' : 's'}`)
    excludedByClass.set(row.account_class, entry)
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[28px] font-medium tracking-tight text-text">
            Usage
          </h1>
          <p className="mt-1 text-[14px] text-text-2">
            Real users only. Ghost imports, admins, internal/demo, test,
            founder, and bot accounts are excluded.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={headline.total_students}
          icon={<Users className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Onboarded students"
          value={headline.onboarded_students}
          trend={`${pct(headline.onboarded_students, headline.total_students)} of students`}
          icon={<UserCheck className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Approved real mentors"
          value={headline.approved_real_mentors}
          icon={<GraduationCap className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Active pairs"
          value={headline.active_pairs}
          trend={
            founderPairs > 0
              ? `${founderPairs} with a founder/internal mentor`
              : undefined
          }
          tone={founderPairs > 0 ? 'warning' : undefined}
          icon={<Handshake className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Students who messaged"
          value={headline.students_messaged}
          icon={<MessageCircle className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Sessions completed"
          value={headline.sessions_completed}
          icon={<CalendarCheck className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Paying subscribers"
          value={headline.paying_subscribers}
          icon={<CreditCard className="h-[18px] w-[18px]" />}
        />
      </section>

      {metrics.pairs_by_mentor_class.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15px] font-semibold text-text">
              Mentor side of active pairs
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              Pairs count when the student is real. This shows who those
              students are matched with.
            </p>
            <table className="mt-4 w-full text-[13px]">
              <thead>
                <tr className="text-left text-text-3">
                  <th className="py-2 font-medium">Mentor account class</th>
                  <th className="py-2 text-right font-medium">Pairs</th>
                  <th className="py-2 text-right font-medium">Mentors</th>
                </tr>
              </thead>
              <tbody>
                {metrics.pairs_by_mentor_class.map((row) => (
                  <tr key={row.mentor_class} className="border-t border-border">
                    <td className="py-2 text-text">
                      {CLASS_LABELS[row.mentor_class] ?? row.mentor_class}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.pairs}</td>
                    <td className="py-2 text-right tabular-nums">{row.mentors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-text">Last 6 months</h2>
          <div className="flex rounded-[var(--radius-sm)] border border-border p-0.5 text-[13px]">
            {(['week', 'month'] as const).map((b) => (
              <Link
                key={b}
                href={`/admin/usage?interval=${b}`}
                className={cn(
                  'rounded-[var(--radius-sm)] px-3 py-1 font-medium',
                  bucket === b
                    ? 'bg-primary-light text-primary'
                    : 'text-text-2 hover:text-text'
                )}
              >
                {b === 'week' ? 'Weekly' : 'Monthly'}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TREND_SERIES.map((series) => (
            <TrendChart
              key={series.key}
              label={series.label}
              bucket={bucket}
              points={metrics.trend.map((row) => ({
                at: row.bucket_start,
                value: row[series.key],
              }))}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15px] font-semibold text-text">Student funnel</h2>
            <p className="mt-1 text-[13px] text-text-2">
              Each step only counts students who also reached the previous one.
            </p>
            <div className="mt-4 space-y-3">
              {FUNNEL_STEPS.map((step, i) => {
                const value = funnel[step.key]
                const prev = i === 0 ? value : funnel[FUNNEL_STEPS[i - 1].key]
                return (
                  <div key={step.key}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-text">{step.label}</span>
                      <span className="tabular-nums text-text-2">
                        <span className="font-semibold text-text">{value}</span>
                        {i > 0 && ` · ${pct(value, prev)} of previous`}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-surface-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${funnel.signed_up ? (value / funnel.signed_up) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15px] font-semibold text-text">
              Mentor claim campaign
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              {claim.imported} imported mentors, {claim.emailed} emailed so far.
            </p>
            <table className="mt-4 w-full text-[13px]">
              <tbody>
                {[
                  ['Step 0 (not emailed yet)', claim.step_0],
                  ['Step 1', claim.step_1],
                  ['Step 2', claim.step_2],
                  ['Step 3', claim.step_3],
                  ['Claimed', claim.claimed],
                  ['Opted out (unreachable)', claim.opted_out],
                  ['Hidden (no claim status, paused)', claim.hidden],
                  ['Still ghost', claim.still_ghost],
                ].map(([label, value]) => (
                  <tr key={label} className="border-t border-border first:border-t-0">
                    <td className="py-2 text-text">{label}</td>
                    <td className="py-2 text-right tabular-nums">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-[15px] font-semibold text-text">Excluded accounts</h2>
          <p className="mt-1 text-[13px] text-text-2">
            Filtered out of every number above (except the mentor side of
            pairs).
          </p>
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-left text-text-3">
                <th className="py-2 font-medium">Class</th>
                <th className="py-2 font-medium">Breakdown</th>
                <th className="py-2 text-right font-medium">Accounts</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(excludedByClass.entries()).map(([cls, entry]) => (
                <tr key={cls} className="border-t border-border">
                  <td className="py-2 text-text">{CLASS_LABELS[cls] ?? cls}</td>
                  <td className="py-2 text-text-2">{entry.roles.join(', ')}</td>
                  <td className="py-2 text-right tabular-nums">{entry.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendChart({
  label,
  bucket,
  points,
}: {
  label: string
  bucket: Bucket
  points: { at: string; value: number }[]
}) {
  const peak = Math.max(0, ...points.map((p) => p.value))
  const max = Math.max(1, peak)
  const total = points.reduce((sum, p) => sum + p.value, 0)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-text-2">{label}</p>
          <p className="text-[13px] tabular-nums text-text-3">{total} total</p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-[2px]">
          {points.map((p) => (
            <div
              key={p.at}
              className="group relative flex h-full flex-1 items-end"
              title={`${formatBucket(p.at, bucket)}: ${p.value}`}
            >
              <div
                className={cn(
                  'w-full rounded-t-[2px]',
                  p.value > 0 ? 'bg-primary' : 'bg-surface-2'
                )}
                style={{ height: p.value > 0 ? `${(p.value / max) * 100}%` : '2px' }}
              />
            </div>
          ))}
        </div>
        {points.length > 0 && (
          <div className="mt-2 flex justify-between text-[11px] text-text-3">
            <span>{formatBucket(points[0].at, bucket)}</span>
            <span>peak {peak}</span>
            <span>{formatBucket(points[points.length - 1].at, bucket)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
