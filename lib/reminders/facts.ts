import type { SupabaseClient } from '@supabase/supabase-js'

import { normalizeOptIns } from '@/lib/scheduling/slots'

import {
  REMINDERS,
  type ReminderAudience,
  type ReminderKey,
} from './definitions'
import { DEFAULT_TIME_ZONE, isValidTimeZone, localDate, timeZoneForState } from './time'

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  role: string
  onboarding_complete: boolean | null
  created_at: string
  moderation_status: string | null
}

interface MentorProfileRow {
  user_id: string
  status: string
  claim_status: string | null
  availability_slots: unknown
  max_mentees: number | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  university: string | null
  timezone: string | null
}

interface StudentProfileRow {
  user_id: string
  matched_mentor_id: string | null
  matched_at: string | null
  state: string | null
  created_at: string
  needs_rematch_at: string | null
  rematch_reason: string | null
}

interface PreferenceRow {
  user_id: string
  unsubscribed_at: string | null
  email_bounced_at: string | null
}

export interface ReminderContext {
  firstName: string
  mentorFirstName?: string
  mentorSchool?: string
  studentFirstNames?: string[]
  ccParent?: boolean
}

export type Evaluation =
  | { status: 'eligible'; anchorAt: string; ctx: ReminderContext }
  | { status: 'done'; at: string }
  | { status: 'skip'; reason: string }

export interface Recipient {
  userId: string
  email: string
  fullName: string
  audience: ReminderAudience
  zone: string
  signupDate: string
  parentEmails: string[]
}

export interface ReminderFacts {
  users: Map<string, UserRow>
  accountClass: Map<string, string>
  mentors: Map<string, MentorProfileRow>
  students: Map<string, StudentProfileRow>
  studentsByMentor: Map<string, StudentProfileRow[]>
  firstMessageAt: Map<string, string>
  firstBookingAt: Map<string, string>
  preferences: Map<string, PreferenceRow>
  parentEmails: Map<string, string[]>
}

const PAGE_SIZE = 1000
const IMPORTED_CLAIM_STATUSES = new Set(['ghost', 'claim_pending', 'unreachable'])

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

function inChunks<T>(ids: string[], size = 200): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size))
  return chunks
}

/**
 * Loads everything the reminder rules read. With `scope`, loads just those
 * users plus their matched counterparts (for the pre-send re-check).
 */
export async function loadReminderFacts(
  supabase: SupabaseClient,
  scope?: string[]
): Promise<ReminderFacts> {
  const studentCols =
    'user_id, matched_mentor_id, matched_at, state, created_at, needs_rematch_at, rematch_reason'

  let studentRows: StudentProfileRow[]
  if (scope) {
    const list = scope.join(',')
    const { data, error } = await supabase
      .from('student_profiles')
      .select(studentCols)
      .or(`user_id.in.(${list}),matched_mentor_id.in.(${list})`)
      .returns<StudentProfileRow[]>()
    if (error) throw new Error(error.message)
    studentRows = data ?? []
  } else {
    studentRows = await fetchAll<StudentProfileRow>((from, to) =>
      supabase.from('student_profiles').select(studentCols).order('user_id').range(from, to)
    )
  }

  const userCols = 'id, email, full_name, role, onboarding_complete, created_at, moderation_status'
  const mentorCols =
    'user_id, status, claim_status, availability_slots, max_mentees, submitted_at, reviewed_at, created_at, university, timezone'

  let userRows: UserRow[]
  let classRows: { user_id: string; account_class: string }[]
  let mentorRows: MentorProfileRow[]
  let prefRows: PreferenceRow[]

  if (scope) {
    const related = Array.from(
      new Set([
        ...scope,
        ...studentRows.map((s) => s.user_id),
        ...studentRows.flatMap((s) => (s.matched_mentor_id ? [s.matched_mentor_id] : [])),
      ])
    )
    const [u, c, m, p] = await Promise.all([
      supabase.from('users').select(userCols).in('id', related).returns<UserRow[]>(),
      supabase
        .from('admin_user_classification')
        .select('user_id, account_class')
        .in('user_id', related)
        .returns<{ user_id: string; account_class: string }[]>(),
      supabase.from('mentor_profiles').select(mentorCols).in('user_id', related).returns<MentorProfileRow[]>(),
      supabase
        .from('email_preferences')
        .select('user_id, unsubscribed_at, email_bounced_at')
        .in('user_id', related)
        .returns<PreferenceRow[]>(),
    ])
    for (const res of [u, c, m, p]) if (res.error) throw new Error(res.error.message)
    userRows = u.data ?? []
    classRows = c.data ?? []
    mentorRows = m.data ?? []
    prefRows = p.data ?? []
  } else {
    ;[userRows, classRows, mentorRows, prefRows] = await Promise.all([
      fetchAll<UserRow>((from, to) =>
        supabase.from('users').select(userCols).in('role', ['mentor', 'student']).order('id').range(from, to)
      ),
      fetchAll<{ user_id: string; account_class: string }>((from, to) =>
        supabase
          .from('admin_user_classification')
          .select('user_id, account_class')
          .order('user_id')
          .range(from, to)
      ),
      fetchAll<MentorProfileRow>((from, to) =>
        supabase
          .from('mentor_profiles')
          .select(mentorCols)
          .or('signup_source.neq.csv_import_2023,claimed_at.not.is.null')
          .order('user_id')
          .range(from, to)
      ),
      fetchAll<PreferenceRow>((from, to) =>
        supabase
          .from('email_preferences')
          .select('user_id, unsubscribed_at, email_bounced_at')
          .order('user_id')
          .range(from, to)
      ),
    ])
  }

  const matchedStudentIds = studentRows.filter((s) => s.matched_mentor_id).map((s) => s.user_id)
  type ActivityRow = { user_id: string; first_message_at: string | null; first_booking_at: string | null }
  const activity = new Map<string, ActivityRow>()
  for (const chunk of inChunks(matchedStudentIds)) {
    const { data, error } = await supabase.rpc('email_reminder_student_facts', {
      p_user_ids: chunk,
    })
    if (error) throw new Error(error.message)
    for (const row of (data ?? []) as ActivityRow[]) activity.set(row.user_id, row)
  }

  const studentIds = studentRows.map((s) => s.user_id)
  const parentEmails = new Map<string, string[]>()
  const addParent = (studentId: string, email: string | null | undefined) => {
    if (!email) return
    const list = parentEmails.get(studentId) ?? []
    if (!list.some((e) => e.toLowerCase() === email.toLowerCase())) list.push(email)
    parentEmails.set(studentId, list)
  }
  for (const chunk of inChunks(studentIds)) {
    const [links, apps] = await Promise.all([
      supabase
        .from('parent_links')
        .select('student_user_id, parent:users!parent_links_parent_user_id_fkey(email)')
        .in('student_user_id', chunk)
        .returns<{ student_user_id: string; parent: { email: string | null } | null }[]>(),
      supabase
        .from('eligibility_applications')
        .select('granted_user_id, email')
        .eq('status', 'approved')
        .in('granted_user_id', chunk)
        .returns<{ granted_user_id: string; email: string | null }[]>(),
    ])
    if (links.error) throw new Error(links.error.message)
    if (apps.error) throw new Error(apps.error.message)
    for (const row of links.data ?? []) addParent(row.student_user_id, row.parent?.email)
    for (const row of apps.data ?? []) addParent(row.granted_user_id, row.email)
  }

  const studentsByMentor = new Map<string, StudentProfileRow[]>()
  for (const s of studentRows) {
    if (!s.matched_mentor_id) continue
    const list = studentsByMentor.get(s.matched_mentor_id) ?? []
    list.push(s)
    studentsByMentor.set(s.matched_mentor_id, list)
  }

  const firstMessageAt = new Map<string, string>()
  const firstBookingAt = new Map<string, string>()
  activity.forEach((row, id) => {
    if (row.first_message_at) firstMessageAt.set(id, row.first_message_at)
    if (row.first_booking_at) firstBookingAt.set(id, row.first_booking_at)
  })

  return {
    users: new Map(userRows.map((u) => [u.id, u])),
    accountClass: new Map(classRows.map((c) => [c.user_id, c.account_class])),
    mentors: new Map(mentorRows.map((m) => [m.user_id, m])),
    students: new Map(studentRows.map((s) => [s.user_id, s])),
    studentsByMentor,
    firstMessageAt,
    firstBookingAt,
    preferences: new Map(prefRows.map((p) => [p.user_id, p])),
    parentEmails,
  }
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}

export function slotCount(facts: ReminderFacts, mentorId: string): number {
  return normalizeOptIns(facts.mentors.get(mentorId)?.availability_slots).size
}

/** Real students matched to this mentor; these are the ones who can't book without availability. */
export function waitingStudents(facts: ReminderFacts, mentorId: string): StudentProfileRow[] {
  return (facts.studentsByMentor.get(mentorId) ?? []).filter(
    (s) =>
      facts.accountClass.get(s.user_id) === 'real' && facts.users.get(s.user_id)?.role === 'student'
  )
}

function isActiveMentor(mp: MentorProfileRow | undefined): mp is MentorProfileRow {
  return (
    !!mp &&
    mp.status === 'approved' &&
    (mp.claim_status === 'claimed' || mp.claim_status === null)
  )
}

/** Whether a reminder's goal is met, still pending, or doesn't apply right now. */
export function evaluateReminder(
  facts: ReminderFacts,
  userId: string,
  key: ReminderKey,
  now: Date
): Evaluation {
  const user = facts.users.get(userId)
  if (!user) return { status: 'skip', reason: 'no_user' }
  if (user.role !== REMINDERS[key].audience) return { status: 'skip', reason: 'wrong_role' }
  const ctx: ReminderContext = { firstName: firstName(user.full_name) }
  const nowIso = now.toISOString()

  switch (key) {
    case 'mentor_finish_profile': {
      const mp = facts.mentors.get(userId)
      if (mp?.submitted_at) return { status: 'done', at: mp.submitted_at }
      if (mp && mp.claim_status && IMPORTED_CLAIM_STATUSES.has(mp.claim_status)) {
        return { status: 'skip', reason: 'imported_profile' }
      }
      if (mp && (mp.status === 'rejected' || mp.status === 'paused')) {
        return { status: 'skip', reason: `mentor_${mp.status}` }
      }
      return { status: 'eligible', anchorAt: user.created_at, ctx }
    }

    case 'mentor_set_availability':
    case 'mentor_matched_no_availability': {
      const mp = facts.mentors.get(userId)
      if (!isActiveMentor(mp)) return { status: 'skip', reason: 'mentor_not_active' }
      if (slotCount(facts, userId) > 0) return { status: 'done', at: nowIso }
      const waiting = waitingStudents(facts, userId)
      ctx.mentorSchool = mp.university || undefined

      if (key === 'mentor_set_availability') {
        if (waiting.length > 0) return { status: 'skip', reason: 'has_matched_students' }
        if ((mp.max_mentees ?? 3) <= 0) return { status: 'skip', reason: 'at_capacity' }
        return {
          status: 'eligible',
          anchorAt: mp.reviewed_at ?? mp.submitted_at ?? mp.created_at,
          ctx,
        }
      }

      if (waiting.length === 0) return { status: 'skip', reason: 'no_matched_students' }
      const anchorAt = waiting
        .map((s) => s.matched_at ?? mp.reviewed_at ?? mp.created_at)
        .reduce((a, b) => (a > b ? a : b))
      ctx.studentFirstNames = waiting
        .map((s) => firstName(facts.users.get(s.user_id)?.full_name))
        .filter(Boolean)
      return { status: 'eligible', anchorAt, ctx }
    }

    case 'student_finish_onboarding': {
      if (user.onboarding_complete) {
        return { status: 'done', at: facts.students.get(userId)?.created_at ?? nowIso }
      }
      return { status: 'eligible', anchorAt: user.created_at, ctx }
    }

    case 'student_say_hi':
    case 'student_book_first_session': {
      const sp = facts.students.get(userId)
      if (!sp?.matched_mentor_id) return { status: 'skip', reason: 'not_matched' }
      const mentorId = sp.matched_mentor_id
      const mentorUser = facts.users.get(mentorId)
      ctx.mentorFirstName = firstName(mentorUser?.full_name) || 'your mentor'
      ctx.mentorSchool = facts.mentors.get(mentorId)?.university || undefined
      const messagedAt = facts.firstMessageAt.get(userId)

      if (key === 'student_say_hi') {
        if (messagedAt) return { status: 'done', at: messagedAt }
        return { status: 'eligible', anchorAt: sp.matched_at ?? sp.created_at, ctx }
      }

      const bookedAt = facts.firstBookingAt.get(userId)
      if (bookedAt) return { status: 'done', at: bookedAt }
      if (!messagedAt) return { status: 'skip', reason: 'not_messaged' }
      if (slotCount(facts, mentorId) === 0) return { status: 'skip', reason: 'mentor_no_availability' }
      return { status: 'eligible', anchorAt: messagedAt, ctx }
    }
  }
}

/** Who to email and in what time zone, or why this person gets no reminders at all. */
export function resolveRecipient(
  facts: ReminderFacts,
  userId: string
): { ok: true; recipient: Recipient } | { ok: false; reason: string } {
  const user = facts.users.get(userId)
  if (!user || !user.email) return { ok: false, reason: 'no_email' }
  if (user.role !== 'mentor' && user.role !== 'student') return { ok: false, reason: 'role' }

  const prefs = facts.preferences.get(userId)
  if (prefs?.unsubscribed_at) return { ok: false, reason: 'unsubscribed' }
  if (prefs?.email_bounced_at) return { ok: false, reason: 'bounced' }
  if (user.moderation_status && user.moderation_status !== 'active') {
    return { ok: false, reason: 'moderation' }
  }

  const cls = facts.accountClass.get(userId) ?? 'unknown'
  const founderMentorWithStudents =
    cls === 'founder' && user.role === 'mentor' && waitingStudents(facts, userId).length > 0
  if (cls !== 'real' && !founderMentorWithStudents) return { ok: false, reason: `class_${cls}` }

  const audience: ReminderAudience = user.role === 'mentor' ? 'mentor' : 'student'
  const mentorZone = facts.mentors.get(userId)?.timezone
  const zone =
    audience === 'mentor'
      ? isValidTimeZone(mentorZone)
        ? mentorZone
        : DEFAULT_TIME_ZONE
      : timeZoneForState(facts.students.get(userId)?.state)

  const parents =
    audience === 'student'
      ? (facts.parentEmails.get(userId) ?? []).filter(
          (e) => e.toLowerCase() !== user.email?.toLowerCase()
        )
      : []

  return {
    ok: true,
    recipient: {
      userId,
      email: user.email,
      fullName: user.full_name ?? '',
      audience,
      zone,
      signupDate: localDate(user.created_at, zone),
      parentEmails: parents,
    },
  }
}
