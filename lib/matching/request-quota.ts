import { MAX_MATCH_REQUESTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export type MatchRequestQuota = {
  max: number
  used: number
  remaining: number
  atCap: boolean
}

/** Count outstanding (pending|forwarded) match requests for a student. */
export async function getStudentMatchRequestQuota(
  studentId: string
): Promise<MatchRequestQuota> {
  const supabase = createClient()
  const { count } = await supabase
    .from('match_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .in('status', ['pending', 'forwarded'])

  const used = count ?? 0
  const remaining = Math.max(0, MAX_MATCH_REQUESTS - used)
  return {
    max: MAX_MATCH_REQUESTS,
    used,
    remaining,
    atCap: used >= MAX_MATCH_REQUESTS,
  }
}
