'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Result = { ok: true; message: string } | { ok: false; error: string }

type ApplicationRow = {
  id: string
  email: string
  student_email: string | null
  status: string
  granted_user_id: string | null
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
  return { ok: true as const, adminId: user.id }
}

/**
 * Approves an application and turns on free access for the student's
 * account if one exists with the student or family email. Re-running it on
 * an approved application with no linked account retries the lookup.
 */
export async function approveEligibilityApplication(id: string): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const service = createServiceClient()
  const { data: app } = await service
    .from('eligibility_applications')
    .select('id, email, student_email, status, granted_user_id')
    .eq('id', id)
    .maybeSingle<ApplicationRow>()

  if (!app) return { ok: false, error: 'Application not found.' }
  const isRetry = app.status === 'approved' && !app.granted_user_id
  if (app.status !== 'pending' && !isRetry) {
    return { ok: false, error: `This application is already ${app.status}.` }
  }

  const emails = [app.student_email, app.email].filter(
    (e): e is string => !!e
  )
  const { data: candidates } = await service
    .from('users')
    .select('id, email, subscription_status')
    .eq('role', 'student')
    .in('email', emails)
    .returns<{ id: string; email: string; subscription_status: string }[]>()

  const student =
    emails
      .map((e) => candidates?.find((c) => c.email.toLowerCase() === e))
      .find((c) => !!c) ?? null

  let message: string
  if (!student) {
    message =
      'Approved. No student account uses these emails yet, so run Check again after they sign up.'
  } else if (student.subscription_status === 'inactive') {
    const { error } = await service
      .from('users')
      .update({ subscription_status: 'free' })
      .eq('id', student.id)
    if (error) return { ok: false, error: 'Could not turn on free access.' }
    message = 'Approved. Free access is on for their account.'
  } else {
    message = `Approved. Their account was already ${student.subscription_status}, so nothing changed.`
  }

  const { error: updateError } = await service
    .from('eligibility_applications')
    .update({
      status: 'approved',
      counselor_status: 'confirmed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.adminId,
      granted_user_id: student?.id ?? null,
    })
    .eq('id', id)
  if (updateError) return { ok: false, error: 'Could not update application.' }

  revalidatePath('/admin/eligibility')
  return { ok: true, message }
}

export async function denyEligibilityApplication(id: string): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const service = createServiceClient()
  const { data: updated, error } = await service
    .from('eligibility_applications')
    .update({
      status: 'denied',
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.adminId,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')

  if (error) return { ok: false, error: 'Could not update application.' }
  if (!updated?.length) {
    return { ok: false, error: 'Only pending applications can be denied.' }
  }

  revalidatePath('/admin/eligibility')
  return { ok: true, message: 'Denied.' }
}
