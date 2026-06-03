import { createClient } from '@/lib/supabase/server'

export type CollegeRecord = {
  id: string
  name: string
  state: string
}

export type MajorRecord = {
  id: string
  name: string
}

// PostgREST caps a single response at the project's "Max rows" setting
// (1000 by default). The colleges table has >1000 rows, so a plain select
// silently drops everything past the cap (alphabetically: William Paterson
// through Zaytuna, including Yale). Page through with .range() so every
// college is returned regardless of the server cap.
const COLLEGE_PAGE_SIZE = 1000

export async function getColleges(): Promise<CollegeRecord[]> {
  const supabase = createClient()
  const all: CollegeRecord[] = []

  for (let from = 0; ; from += COLLEGE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, state')
      .order('name')
      .range(from, from + COLLEGE_PAGE_SIZE - 1)

    if (error) {
      console.error('Failed to load colleges:', error.message)
      return all
    }

    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < COLLEGE_PAGE_SIZE) break
  }

  return all
}

export async function getMajors(): Promise<MajorRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('majors')
    .select('id, name, popularity')
    .order('popularity', { ascending: false })

  if (error) {
    console.error('Failed to load majors:', error.message)
    return []
  }
  return (data ?? []).map(({ id, name }) => ({ id, name }))
}
