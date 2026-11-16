import type { SupabaseClient } from '@supabase/supabase-js'

import { createLoginLink } from '@/lib/auth/login-links'
import { notifyReminder } from '@/lib/email/notifications'
import { getUnsubscribeToken, markEmailsUndeliverable, unsubscribeUrls } from '@/lib/email/preferences'

import { reminderCopy } from './copy'
import {
  LOGIN_LINK_DAYS,
  QUIET_HOUR,
  REMATCH_GRACE_DAYS,
  REMINDERS,
  REMINDER_KEYS,
  SEND_HOUR,
  type ReminderKey,
} from './definitions'
import {
  evaluateReminder,
  loadReminderFacts,
  resolveRecipient,
  slotCount,
  waitingStudents,
  type Recipient,
  type ReminderContext,
  type ReminderFacts,
} from './facts'
import { nextStep, sameInstant, stateAfterSend, type NextStep, type ReminderState } from './schedule'
import {
  loadReminderSettings,
  reminderMode,
  remindersGloballyEnabled,
  type ReminderMode,
  type ReminderSetting,
} from './settings'
import { localDate, localHour } from './time'

const DAY_MS = 24 * 60 * 60 * 1000
// Resend's default rate limit is 2 requests per second.
const SEND_SPACING_MS = 600
const MAX_FAILURES_PER_DAY = 2

export type CronSchedule = 'hourly' | 'daily'

/**
 * Hourly runs send inside each person's local window. Daily runs (Vercel
 * Hobby) send everything due that day whenever the job fires.
 */
export function cronSchedule(): CronSchedule {
  return process.env.REMINDERS_CRON_SCHEDULE === 'daily' ? 'daily' : 'hourly'
}

export interface PlanItem {
  recipient: Recipient
  key: ReminderKey
  next: Extract<NextStep, { kind: 'due' }>
  today: string
  anchorAt: string
  ctx: ReminderContext
  mode: ReminderMode
  inWindow: boolean
}

export interface ReminderPlan {
  /** Per person, the one reminder they'd get today if every reminder were live. */
  wouldSend: PlanItem[]
  /** Per person, the highest-priority live reminder due today. */
  toSend: PlanItem[]
  skipped: Record<string, number>
  facts: ReminderFacts
  states: Map<string, ReminderState>
  settings: Map<ReminderKey, ReminderSetting>
}

const stateKey = (userId: string, key: ReminderKey) => `${userId}:${key}`

const KEYS_BY_PRIORITY = [...REMINDER_KEYS].sort(
  (a, b) => REMINDERS[a].priority - REMINDERS[b].priority
)

async function loadStates(supabase: SupabaseClient): Promise<Map<string, ReminderState>> {
  const { data, error } = await supabase
    .from('email_reminder_state')
    .select(
      'user_id, reminder_key, anchor_at, round, step, round_started_at, last_sent_at, next_due_at, completed_at, stopped_reason, converted_at'
    )
    .returns<ReminderState[]>()
  if (error) throw new Error(error.message)
  return new Map((data ?? []).map((s) => [stateKey(s.user_id, s.reminder_key), s]))
}

function inSendWindow(recipient: Recipient, now: Date, schedule: CronSchedule): boolean {
  if (schedule === 'daily') return true
  const hour = localHour(now, recipient.zone)
  return hour >= SEND_HOUR[recipient.audience] && hour < QUIET_HOUR
}

/** Candidate reminders for one person, best first. Pure apart from the inputs. */
function candidatesFor(
  facts: ReminderFacts,
  states: Map<string, ReminderState>,
  settings: Map<ReminderKey, ReminderSetting>,
  recipient: Recipient,
  now: Date,
  schedule: CronSchedule
): PlanItem[] {
  const today = localDate(now, recipient.zone)
  const items: PlanItem[] = []
  for (const key of KEYS_BY_PRIORITY) {
    const def = REMINDERS[key]
    if (def.audience !== recipient.audience) continue
    const evaluation = evaluateReminder(facts, recipient.userId, key, now)
    if (evaluation.status !== 'eligible') continue

    let state = states.get(stateKey(recipient.userId, key)) ?? null
    if (state && !sameInstant(state.anchor_at, evaluation.anchorAt)) state = null
    if (state?.completed_at) continue

    const next = nextStep(def, state, evaluation.anchorAt, recipient.zone)
    if (next.kind !== 'due' || next.dueDate > today) continue

    items.push({
      recipient,
      key,
      next,
      today,
      anchorAt: evaluation.anchorAt,
      ctx: evaluation.ctx,
      mode: reminderMode(settings.get(key), now),
      inWindow: inSendWindow(recipient, now, schedule),
    })
  }
  return items
}

export async function planReminders(
  supabase: SupabaseClient,
  { now = new Date(), schedule = cronSchedule() }: { now?: Date; schedule?: CronSchedule } = {}
): Promise<ReminderPlan> {
  const [settings, facts, states] = await Promise.all([
    loadReminderSettings(supabase),
    loadReminderFacts(supabase),
    loadStates(supabase),
  ])

  const wouldSend: PlanItem[] = []
  const toSend: PlanItem[] = []
  const skipped: Record<string, number> = {}
  const bump = (reason: string) => {
    skipped[reason] = (skipped[reason] ?? 0) + 1
  }

  facts.users.forEach((user) => {
    if (user.role !== 'mentor' && user.role !== 'student') return
    const resolved = resolveRecipient(facts, user.id)
    if (!resolved.ok) return bump(resolved.reason)
    const { recipient } = resolved
    if (localDate(now, recipient.zone) === recipient.signupDate) return bump('signup_day')

    const candidates = candidatesFor(facts, states, settings, recipient, now, schedule)
    if (candidates.length === 0) return
    wouldSend.push(candidates[0])
    const live = candidates.find((c) => c.mode === 'live')
    if (live) toSend.push(live)
  })

  return { wouldSend, toSend, skipped, facts, states, settings }
}

/**
 * Marks reminders whose goal was met, flags students stuck with a mentor who
 * finished a full round without adding availability, and clears flags once
 * the mentor has times.
 */
async function housekeeping(
  supabase: SupabaseClient,
  facts: ReminderFacts,
  states: Map<string, ReminderState>,
  now: Date
): Promise<{ converted: number; flagged: number; cleared: number }> {
  const nowIso = now.toISOString()
  let converted = 0

  for (const state of Array.from(states.values())) {
    if (state.converted_at || state.stopped_reason === 'converted') continue
    const evaluation = evaluateReminder(facts, state.user_id, state.reminder_key, now)
    if (evaluation.status !== 'done') continue
    const { error } = await supabase
      .from('email_reminder_state')
      .update({
        converted_at: evaluation.at,
        ...(state.completed_at ? {} : { completed_at: nowIso, stopped_reason: 'converted' }),
        next_due_at: null,
        updated_at: nowIso,
      })
      .eq('user_id', state.user_id)
      .eq('reminder_key', state.reminder_key)
    if (!error) {
      converted++
      state.converted_at = evaluation.at
    }
  }

  const graceCutoff = now.getTime() - REMATCH_GRACE_DAYS * DAY_MS
  const toFlag = new Set<string>()
  states.forEach((state) => {
    if (
      state.reminder_key !== 'mentor_set_availability' &&
      state.reminder_key !== 'mentor_matched_no_availability'
    ) {
      return
    }
    if (state.converted_at || state.step < REMINDERS[state.reminder_key].cadence.length) return
    if (!state.last_sent_at || new Date(state.last_sent_at).getTime() > graceCutoff) return
    if (slotCount(facts, state.user_id) > 0) return
    for (const student of waitingStudents(facts, state.user_id)) {
      if (!student.needs_rematch_at) toFlag.add(student.user_id)
    }
  })

  const toClear: string[] = []
  facts.students.forEach((student) => {
    if (
      student.needs_rematch_at &&
      student.rematch_reason === 'mentor_no_availability' &&
      student.matched_mentor_id &&
      slotCount(facts, student.matched_mentor_id) > 0
    ) {
      toClear.push(student.user_id)
    }
  })

  let flagged = 0
  if (toFlag.size > 0) {
    const { data } = await supabase
      .from('student_profiles')
      .update({ needs_rematch_at: nowIso, rematch_reason: 'mentor_no_availability' })
      .in('user_id', Array.from(toFlag))
      .is('needs_rematch_at', null)
      .select('user_id')
    flagged = data?.length ?? 0
  }

  let cleared = 0
  if (toClear.length > 0) {
    const { data } = await supabase
      .from('student_profiles')
      .update({ needs_rematch_at: null, rematch_reason: null })
      .in('user_id', toClear)
      .select('user_id')
    cleared = data?.length ?? 0
  }

  return { converted, flagged, cleared }
}

interface ReminderTotals {
  wouldSend: number
  live: number
  sent: number
  failed: number
}

export interface ReminderRunResult {
  globalMode: 'live' | 'dry_run'
  schedule: CronSchedule
  ranAt: string
  byReminder: Record<ReminderKey, ReminderTotals & { mode: ReminderMode }>
  wouldSendByRound: Record<string, number>
  sent: number
  failed: number
  outsideWindow: number
  alreadyEmailedToday: number
  recheckDropped: number
  overLimit: number
  dryRunLogged: number
  skipped: Record<string, number>
  housekeeping: { converted: number; flagged: number; cleared: number }
}

export async function runReminders(
  supabase: SupabaseClient,
  {
    now = new Date(),
    limit,
    schedule = cronSchedule(),
    recordDryRun = true,
  }: { now?: Date; limit: number; schedule?: CronSchedule; recordDryRun?: boolean }
): Promise<ReminderRunResult> {
  const plan = await planReminders(supabase, { now, schedule })
  const housekeepingResult = await housekeeping(supabase, plan.facts, plan.states, now)

  const byReminder = Object.fromEntries(
    REMINDER_KEYS.map((key) => [
      key,
      { mode: reminderMode(plan.settings.get(key), now), wouldSend: 0, live: 0, sent: 0, failed: 0 },
    ])
  ) as ReminderRunResult['byReminder']
  const wouldSendByRound: Record<string, number> = {}
  for (const item of plan.wouldSend) {
    byReminder[item.key].wouldSend++
    const label = `${item.key}:r${item.next.round}s${item.next.step + 1}`
    wouldSendByRound[label] = (wouldSendByRound[label] ?? 0) + 1
  }
  for (const item of plan.toSend) byReminder[item.key].live++

  const { data: recentLogs, error: logError } = await supabase
    .from('email_reminder_log')
    .select('user_id, reminder_key, local_date, dry_run, ok')
    .gte('sent_at', new Date(now.getTime() - 2 * DAY_MS).toISOString())
    .returns<
      { user_id: string; reminder_key: string; local_date: string; dry_run: boolean; ok: boolean | null }[]
    >()
  if (logError) throw new Error(logError.message)

  const sentToday = new Set<string>()
  const failuresToday = new Map<string, number>()
  const dryRunToday = new Set<string>()
  for (const row of recentLogs ?? []) {
    const dayKey = `${row.user_id}:${row.local_date}`
    if (row.dry_run) dryRunToday.add(`${dayKey}:${row.reminder_key}`)
    else if (row.ok === false) failuresToday.set(dayKey, (failuresToday.get(dayKey) ?? 0) + 1)
    else sentToday.add(dayKey)
  }

  let dryRunLogged = 0
  if (recordDryRun) {
    const rows = plan.wouldSend
      .filter((item) => item.mode === 'dry_run')
      .filter(
        (item) => !dryRunToday.has(`${item.recipient.userId}:${item.today}:${item.key}`)
      )
      .map((item) => ({
        user_id: item.recipient.userId,
        reminder_key: item.key,
        round: item.next.round,
        step: item.next.step + 1,
        local_date: item.today,
        dry_run: true,
        cc_parent: item.recipient.parentEmails.length > 0,
      }))
    if (rows.length > 0) {
      const { error } = await supabase.from('email_reminder_log').insert(rows)
      if (!error) dryRunLogged = rows.length
      else if (error.code !== '23505') throw new Error(error.message)
    }
  }

  let outsideWindow = 0
  let alreadyEmailedToday = 0
  const queue: PlanItem[] = []
  for (const item of plan.toSend) {
    const dayKey = `${item.recipient.userId}:${item.today}`
    if (sentToday.has(dayKey) || (failuresToday.get(dayKey) ?? 0) >= MAX_FAILURES_PER_DAY) {
      alreadyEmailedToday++
    } else if (!item.inWindow) {
      outsideWindow++
    } else {
      queue.push(item)
    }
  }
  const overLimit = Math.max(0, queue.length - limit)

  let sent = 0
  let failed = 0
  let recheckDropped = 0
  for (const item of queue.slice(0, limit)) {
    const outcome = await sendOne(supabase, item, now)
    if (outcome === 'sent') {
      sent++
      byReminder[item.key].sent++
    } else if (outcome === 'failed') {
      failed++
      byReminder[item.key].failed++
    } else {
      recheckDropped++
    }
    await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS))
  }

  return {
    globalMode: remindersGloballyEnabled() ? 'live' : 'dry_run',
    schedule,
    ranAt: now.toISOString(),
    byReminder,
    wouldSendByRound,
    sent,
    failed,
    outsideWindow,
    alreadyEmailedToday,
    recheckDropped,
    overLimit,
    dryRunLogged,
    skipped: plan.skipped,
    housekeeping: housekeepingResult,
  }
}

async function sendOne(
  supabase: SupabaseClient,
  item: PlanItem,
  now: Date
): Promise<'sent' | 'failed' | 'dropped'> {
  const userId = item.recipient.userId
  const def = REMINDERS[item.key]

  const fresh = await loadReminderFacts(supabase, [userId])
  const evaluation = evaluateReminder(fresh, userId, item.key, now)
  const resolved = resolveRecipient(fresh, userId)
  if (
    evaluation.status !== 'eligible' ||
    !sameInstant(evaluation.anchorAt, item.anchorAt) ||
    !resolved.ok
  ) {
    return 'dropped'
  }
  const recipient = resolved.recipient
  const cc = recipient.parentEmails

  const { data: logRow, error: claimError } = await supabase
    .from('email_reminder_log')
    .insert({
      user_id: userId,
      reminder_key: item.key,
      round: item.next.round,
      step: item.next.step + 1,
      local_date: item.today,
      dry_run: false,
      cc_parent: cc.length > 0,
    })
    .select('id')
    .single<{ id: string }>()
  if (claimError) return claimError.code === '23505' ? 'dropped' : 'failed'

  let result: { ok: boolean; error?: string; undeliverable?: boolean }
  try {
    const [ctaUrl, unsubscribeToken] = await Promise.all([
      createLoginLink(supabase, {
        userId,
        targetPath: def.targetPath,
        purpose: item.key,
        loginDays: LOGIN_LINK_DAYS[def.audience],
      }),
      getUnsubscribeToken(supabase, userId),
    ])
    const urls = unsubscribeUrls(unsubscribeToken)
    const copy = reminderCopy(item.key, item.next.round, item.next.step, {
      ...evaluation.ctx,
      ccParent: cc.length > 0,
    })
    result = await notifyReminder({
      to: recipient.email,
      cc,
      tag: `reminder_${item.key}`,
      ...copy,
      ctaLabel: def.cta,
      ctaUrl,
      unsubscribeUrl: urls.page,
      oneClickUnsubscribeUrl: urls.oneClick,
    })
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : 'send failed' }
  }

  const sentAt = new Date().toISOString()
  await supabase
    .from('email_reminder_log')
    .update({ ok: result.ok, error: result.error?.slice(0, 500) ?? null, sent_at: sentAt })
    .eq('id', logRow.id)

  if (!result.ok) {
    if (result.undeliverable) {
      await markEmailsUndeliverable(supabase, [recipient.email], result.error ?? 'undeliverable')
    }
    return 'failed'
  }

  const nextState = stateAfterSend({
    def,
    userId,
    anchorAt: item.anchorAt,
    sent: item.next,
    sentAt,
    zone: recipient.zone,
    sendHour: SEND_HOUR[def.audience],
  })
  await supabase
    .from('email_reminder_state')
    .upsert({ ...nextState, converted_at: null, updated_at: sentAt }, { onConflict: 'user_id,reminder_key' })

  return 'sent'
}
