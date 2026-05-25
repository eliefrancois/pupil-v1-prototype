'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { notifyMentorApproved } from '@/lib/email/notifications'

type MentorReviewStatus = 'approved' | 'rejected' | 'paused' | 'pending'

type Result = { ok: true } | { ok: false; error: string }

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

export async function updateMentorReviewStatus({
  mentorUserId,
  status,
  reviewNotes,
  mentorEmail,
  mentorName,
  university,
}: {
  mentorUserId: string
  status: MentorReviewStatus
  reviewNotes?: string | null
  mentorEmail: string
  mentorName: string
  university: string | null
}): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth
  const { supabase, adminId } = auth

  const { data: existing } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', mentorUserId)
    .maybeSingle<{ status: string }>()
  if (!existing) return { ok: false, error: 'Mentor profile not found.' }

  const trimmedNotes = (reviewNotes ?? '').trim() || null
  const wasPending = existing.status === 'pending'

  const { error } = await supabase
    .from('mentor_profiles')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      review_notes: trimmedNotes,
    })
    .eq('user_id', mentorUserId)

  if (error) return { ok: false, error: error.message }

  if (status === 'approved' && wasPending) {
    void notifyMentorApproved({
      mentorEmail,
      mentorName,
      university,
    })
  }

  revalidatePath('/admin/mentors')
  revalidatePath('/mentors')
  return { ok: true }
}
