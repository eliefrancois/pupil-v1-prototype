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
  identity_json: {
    gender?: string
    ethnicities?: string[]
    first_gen?: string
    mentee_preferences?: string[]
  } | null
  commitment: string | null
  timezone: string | null
  availability_schedule: { time_windows?: string[] } | null
  availability_slot_count: number
}
