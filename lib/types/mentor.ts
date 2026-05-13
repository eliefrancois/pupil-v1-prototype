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
}
