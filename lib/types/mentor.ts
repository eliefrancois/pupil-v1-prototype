export type PublicMentor = {
  id: string
  display_name: string
  university: string
  major: string | null
  grad_year: number | null
  bio: string | null
  photo_url: string | null
  tags: string[]
  rating: number
  sessions_count: number
  /**
   * True for CSV-imported profiles that haven't been claimed by the mentor
   * yet. The UI shows a softer "Reach out" CTA instead of "Request match",
   * and admin sees them flagged so they can send a claim email if a student
   * requests one.
   */
  is_ghost: boolean
}
