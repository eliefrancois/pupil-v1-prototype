export type MentorReviewItem = {
  user_id: string
  full_name: string
  email: string
  university: string | null
  major: string | null
  grad_year: number | null
  year_in_school: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  tags: string[] | null
  max_mentees: number
  active_mentees_count: number
  sessions_count: number
  rating: number | null
  status: 'pending' | 'approved' | 'rejected' | 'paused'
  submitted_at: string | null
  reviewed_at: string | null
  review_notes: string | null
  motivations: string[] | null
  // Canonical taxonomy stores code arrays/values keyed by dimension_key. Legacy
  // rows may still carry the old gender/ethnicities/first_gen/mentee_preferences
  // shape; the row component resolves both.
  identity_json: Record<string, unknown> | null
  commitment: string | null
  timezone: string | null
  availability_schedule: { time_windows?: string[] } | null
  availability_slot_count: number
}
