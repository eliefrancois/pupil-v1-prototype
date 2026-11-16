import type { MatchedMentor } from '@/lib/supabase/queries'
import type { MentorSummary } from '@/components/billing/upgrade-dialog'

export function toMentorSummary(mentor: MatchedMentor): MentorSummary {
  return {
    firstName: mentor.full_name.split(' ')[0] || 'your mentor',
    fullName: mentor.full_name,
    photoUrl: mentor.photo_url,
    school: mentor.university || null,
  }
}
