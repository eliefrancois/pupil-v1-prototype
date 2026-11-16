import type { SupabaseClient } from '@supabase/supabase-js'

import { REMINDERS, REMINDER_KEYS } from './definitions'
import { loadReminderFacts, slotCount, waitingStudents, type ReminderFacts } from './facts'
import { loadReminderStats } from './stats'

const DAY_MS = 24 * 60 * 60 * 1000
const SILENT_AFTER_DAYS = 7

export interface ReminderDigest {
  stuckMentors: { name: string; waiting: number; daysSinceApproval: number | null }[]
  silentStudents: { name: string; mentorName: string; daysMatched: number }[]
  rematchStudents: { name: string; mentorName: string; daysFlagged: number }[]
  sends: { label: string; sent: number; converted: number }[]
  totals: { sent: number; converted: number; failed: number }
}

function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS)
}

/** Students appear as first name and last initial. */
function studentName(facts: ReminderFacts, userId: string): string {
  const parts = (facts.users.get(userId)?.full_name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Unnamed student'
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

function mentorName(facts: ReminderFacts, userId: string | null): string {
  return (userId && facts.users.get(userId)?.full_name?.trim()) || 'Unknown mentor'
}

export async function buildReminderDigest(
  supabase: SupabaseClient,
  now = new Date()
): Promise<ReminderDigest> {
  const [facts, stats] = await Promise.all([
    loadReminderFacts(supabase),
    loadReminderStats(supabase, now, 7),
  ])

  const stuckMentors: ReminderDigest['stuckMentors'] = []
  facts.mentors.forEach((mp, mentorId) => {
    if (mp.status !== 'approved' || slotCount(facts, mentorId) > 0) return
    const waiting = waitingStudents(facts, mentorId).length
    if (waiting === 0) return
    stuckMentors.push({
      name: mentorName(facts, mentorId),
      waiting,
      daysSinceApproval: daysSince(mp.reviewed_at, now),
    })
  })
  stuckMentors.sort((a, b) => b.waiting - a.waiting)

  const silentStudents: ReminderDigest['silentStudents'] = []
  const rematchStudents: ReminderDigest['rematchStudents'] = []
  facts.students.forEach((sp, studentId) => {
    if (!sp.matched_mentor_id || facts.accountClass.get(studentId) !== 'real') return
    const daysMatched = daysSince(sp.matched_at, now)
    if (daysMatched !== null && daysMatched >= SILENT_AFTER_DAYS && !facts.firstMessageAt.has(studentId)) {
      silentStudents.push({
        name: studentName(facts, studentId),
        mentorName: mentorName(facts, sp.matched_mentor_id),
        daysMatched,
      })
    }
    if (sp.needs_rematch_at) {
      rematchStudents.push({
        name: studentName(facts, studentId),
        mentorName: mentorName(facts, sp.matched_mentor_id),
        daysFlagged: daysSince(sp.needs_rematch_at, now) ?? 0,
      })
    }
  })
  silentStudents.sort((a, b) => b.daysMatched - a.daysMatched)

  return {
    stuckMentors,
    silentStudents,
    rematchStudents,
    sends: REMINDER_KEYS.map((key) => ({
      label: REMINDERS[key].label,
      sent: stats.byReminder[key].sent,
      converted: stats.byReminder[key].converted,
    })),
    totals: {
      sent: stats.totals.sent,
      converted: stats.totals.converted,
      failed: stats.totals.failed,
    },
  }
}
