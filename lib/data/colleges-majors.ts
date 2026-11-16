import { createClient } from '@/lib/supabase/server'
import {
  COLLEGE_COLUMNS,
  COLLEGE_SEARCH_MIN_LENGTH,
  type CollegeRecord,
} from '@/lib/colleges'

export type { CollegeRecord } from '@/lib/colleges'

export type MajorRecord = {
  id: string
  name: string
}

const COLLEGE_SEARCH_LIMIT = 20

// The colleges table holds ~10k schools worldwide, so the picker searches
// server-side instead of shipping the whole list to the browser.
export async function searchColleges(query: string): Promise<CollegeRecord[]> {
  const q = query.trim()
  if (q.length < COLLEGE_SEARCH_MIN_LENGTH) return []

  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_colleges', {
    q,
    max_results: COLLEGE_SEARCH_LIMIT,
  })

  if (error) {
    console.error('Failed to search colleges:', error.message)
    return []
  }
  return (data ?? []) as CollegeRecord[]
}

export async function getCollegeById(id: string): Promise<CollegeRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('colleges')
    .select(COLLEGE_COLUMNS)
    .eq('id', id)
    .maybeSingle<CollegeRecord>()

  if (error) {
    console.error('Failed to load college:', error.message)
    return null
  }
  return data
}

/** Case-insensitive exact name match, for profiles saved before college_id existed. */
export async function findCollegeByName(
  name: string
): Promise<CollegeRecord | null> {
  const escaped = name.trim().replace(/[\\%_]/g, (c) => `\\${c}`)
  if (!escaped) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('colleges')
    .select(COLLEGE_COLUMNS)
    .ilike('name', escaped)
    .limit(1)
    .maybeSingle<CollegeRecord>()

  if (error) {
    console.error('Failed to look up college by name:', error.message)
    return null
  }
  return data
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
