import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { REMINDERS, REMINDER_KEYS, type ReminderKey } from '@/lib/reminders/definitions'
import { cronSchedule, planReminders, type PlanItem } from '@/lib/reminders/run'
import { reminderMode, remindersGloballyEnabled } from '@/lib/reminders/settings'
import { loadReminderStats } from '@/lib/reminders/stats'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createServiceClient } from '@/lib/supabase/service'

import { ReminderToggle, SampleSender } from './controls'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ORDER: ReminderKey[] = [...REMINDER_KEYS].sort((a, b) => {
  const audience = REMINDERS[a].audience.localeCompare(REMINDERS[b].audience)
  return audience !== 0 ? audience : REMINDERS[a].priority - REMINDERS[b].priority
})

function displayName(item: PlanItem): string {
  const parts = item.recipient.fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Unnamed'
  if (item.recipient.audience === 'mentor') return parts.join(' ')
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : '–'
}

export default async function RemindersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/reminders')
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

  const service = createServiceClient()
  const now = new Date()
  const schedule = cronSchedule()
  const [plan, stats] = await Promise.all([
    planReminders(service, { now, schedule }),
    loadReminderStats(service, now),
  ])
  const globalOn = remindersGloballyEnabled()

  const wouldSendByKey = new Map<ReminderKey, PlanItem[]>()
  for (const item of plan.wouldSend) {
    const list = wouldSendByKey.get(item.key) ?? []
    list.push(item)
    wouldSendByKey.set(item.key, list)
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="display text-[28px] font-medium tracking-tight text-text">Reminders</h1>
        <p className="mt-1 text-[14px] text-text-2">
          Lifecycle emails from Dario. One email per person per day, highest priority first.
          Turning a reminder on starts a dry-run day; real sends begin the next day.
        </p>
      </div>

      <Card className={globalOn ? '' : 'border-warning bg-[rgba(245,158,11,0.05)]'}>
        <CardContent className="space-y-1 p-5 text-[13px]">
          <p className="font-medium text-text">
            {globalOn
              ? 'REMINDERS_ENABLED is on. Reminders switched on below send for real.'
              : 'REMINDERS_ENABLED is off. Nothing sends; every reminder is a dry run.'}
          </p>
          <p className="text-text-2">
            Cron mode: {schedule === 'hourly'
              ? 'hourly, sending at 4pm (students) and 6pm (mentors) local time'
              : 'daily, sending everything due that day when the job runs'}
            . Sent in the last 7 days: {stats.totals.sent7}. Last 30 days:{' '}
            {stats.totals.sent}, {stats.totals.converted} converted (
            {pct(stats.totals.converted, stats.totals.sent)}).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ORDER.map((key) => {
          const def = REMINDERS[key]
          const setting = plan.settings.get(key)
          const mode = reminderMode(setting, now)
          const s = stats.byReminder[key]
          const due = wouldSendByKey.get(key) ?? []
          const status = !setting?.enabled
            ? { label: 'Off', variant: 'secondary' as const }
            : mode === 'live'
              ? { label: 'Live', variant: 'success' as const }
              : globalOn
                ? { label: 'Dry run today, live tomorrow', variant: 'warning' as const }
                : { label: 'On (global switch off)', variant: 'warning' as const }

          return (
            <Card key={key}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-text">{def.label}</h2>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-text-2">{def.description}</p>
                  </div>
                  <ReminderToggle reminderKey={key} enabled={!!setting?.enabled} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-5">
                  <Stat label="Would send today" value={due.length} />
                  <Stat label="Sent, 7 days" value={s.sent7} />
                  <Stat label="Sent, 30 days" value={s.sent} />
                  <Stat
                    label="Converted within 3 days"
                    value={`${s.converted} (${pct(s.converted, s.sent)})`}
                  />
                  <Stat
                    label="In progress by round"
                    value={s.activeByRound.join(' / ')}
                    hint={`${s.convertedTotal} did it, ${s.finished} finished all rounds`}
                  />
                </div>

                {due.length > 0 && (
                  <details className="text-[13px]">
                    <summary className="cursor-pointer text-text-2">
                      Who would get it today ({due.length})
                    </summary>
                    <ul className="mt-2 divide-y divide-border rounded-[var(--radius-sm)] border border-border">
                      {due.map((item) => (
                        <li
                          key={item.recipient.userId}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                        >
                          <span className="text-text">{displayName(item)}</span>
                          <span className="text-text-3">
                            Round {item.next.round}, email {item.next.step + 1} of{' '}
                            {def.cadence.length}
                            {item.recipient.parentEmails.length > 0 ? ' · CC parent' : ''}
                            {schedule === 'hourly' && !item.inWindow ? ' · outside send window now' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Preview in your inbox</h2>
            <p className="mt-1 text-[13px] text-text-2">
              Sends every template with sample names to {user.email}. Buttons link straight to
              the page, not a login link.
            </p>
          </div>
          <SampleSender />
        </CardContent>
      </Card>

      {Object.keys(plan.skipped).length > 0 && (
        <Card>
          <CardContent className="p-5 text-[13px]">
            <h2 className="text-[15px] font-semibold text-text">Never emailed</h2>
            <p className="mt-1 text-text-2">
              {Object.entries(plan.skipped)
                .map(([reason, n]) => `${n} ${reason.replace(/^class_/, '').replace(/_/g, ' ')}`)
                .join(' · ')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border px-3 py-2">
      <p className="text-[12px] text-text-3">{label}</p>
      <p className="text-[15px] font-medium tabular-nums text-text">{value}</p>
      {hint && <p className="text-[11px] text-text-3">{hint}</p>}
    </div>
  )
}
