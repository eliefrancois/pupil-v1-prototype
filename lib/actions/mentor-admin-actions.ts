'use server'

import { revalidatePath } from 'next/cache'

import { MENTOR_SPECIALTIES_SET } from '@/lib/constants'
import { normalizeLinkedinUrl } from '@/lib/linkedin'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; error: string }

const MENTOR_STATUSES = ['pending', 'approved', 'rejected', 'paused'] as const
type MentorStatus = (typeof MENTOR_STATUSES)[number]

const YEARS_IN_SCHOOL = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
] as const

export type MentorProfileEditInput = {
  mentorUserId: string
  fullName: string
  university: string
  major: string
  gradYear: string
  yearInSchool: string
  bio: string
  linkedinInput: string
  tags: string[]
  maxMentees: number
  status: string
}

async function ensureAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  if (!data || data.role !== 'admin') {
    return { ok: false as const, error: 'Admins only.' }
  }
  return { ok: true as const, supabase, adminId: user.id }
}

export async function updateMentorProfile(
  input: MentorProfileEditInput
): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase } = auth

  const fullName = input.fullName.trim()
  if (!fullName) {
    return { ok: false, error: 'Full name is required.' }
  }

  const status = input.status as MentorStatus
  if (!MENTOR_STATUSES.includes(status)) {
    return { ok: false, error: 'Invalid status.' }
  }

  const yearInSchool = input.yearInSchool.trim()
  if (yearInSchool && !YEARS_IN_SCHOOL.includes(yearInSchool as never)) {
    return { ok: false, error: 'Invalid year in school.' }
  }

  let gradYear: number | null = null
  const gradYearRaw = input.gradYear.trim()
  if (gradYearRaw) {
    const parsed = Number.parseInt(gradYearRaw, 10)
    if (!Number.isInteger(parsed) || parsed < 1950 || parsed > 2100) {
      return { ok: false, error: 'Enter a valid graduation year.' }
    }
    gradYear = parsed
  }

  if (
    !Number.isInteger(input.maxMentees) ||
    input.maxMentees < 0 ||
    input.maxMentees > 100
  ) {
    return { ok: false, error: 'Max mentees must be between 0 and 100.' }
  }

  // Constrain tags to the canonical specialty taxonomy; silently drop unknowns.
  const tags = Array.from(
    new Set(input.tags.filter((t) => MENTOR_SPECIALTIES_SET.has(t)))
  )

  const linkedin_url = input.linkedinInput.trim()
    ? normalizeLinkedinUrl(input.linkedinInput)
    : null

  const profileUpdate = {
    university: input.university.trim() || null,
    major: input.major.trim() || null,
    grad_year: gradYear,
    year_in_school: yearInSchool || null,
    bio: input.bio.trim() || null,
    linkedin_url,
    tags,
    max_mentees: input.maxMentees,
    status,
  }

  const { error: profileError } = await supabase
    .from('mentor_profiles')
    .update(profileUpdate)
    .eq('user_id', input.mentorUserId)

  if (profileError) return { ok: false, error: profileError.message }

  const { error: userError } = await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', input.mentorUserId)

  if (userError) return { ok: false, error: userError.message }

  revalidatePath('/admin/mentors')
  revalidatePath('/mentors')
  revalidatePath(`/mentors/${input.mentorUserId}`)
  return { ok: true }
}
