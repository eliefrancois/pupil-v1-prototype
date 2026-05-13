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

export async function getColleges(): Promise<CollegeRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, state')
    .order('name')

  if (error) {
    console.error('Failed to load colleges:', error.message)
    return []
  }
  return data ?? []
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
