'use server'

import { revalidatePath } from 'next/cache'

import {
  GHOST_PHOTO_ACCEPT,
  GHOST_PHOTO_MAX_BYTES,
  isPlaceholderMentorPhoto,
} from '@/lib/ghost-photos'
import { normalizeLinkedinUrl } from '@/lib/linkedin'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type UploadResult = { ok: true; photoUrl: string } | { ok: false; error: string }
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
  return { ok: true as const, supabase }
}

async function loadGhostForPhotoOps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mentorUserId: string
) {
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('user_id, claim_status, photo_url')
    .eq('user_id', mentorUserId)
    .maybeSingle<{
      user_id: string
      claim_status: string | null
      photo_url: string | null
    }>()

  if (error) return { ok: false as const, error: error.message }
  if (!data) return { ok: false as const, error: 'Mentor profile not found.' }
  if (data.claim_status !== 'ghost') {
    return { ok: false as const, error: 'Only ghost mentors can be updated here.' }
  }
  if (!isPlaceholderMentorPhoto(data.photo_url)) {
    return {
      ok: false as const,
      error: 'This mentor already has a real photo. Reset photo_url in Supabase to re-queue.',
    }
  }
  return { ok: true as const, profile: data }
}

const ACCEPTED_TYPES = new Set(GHOST_PHOTO_ACCEPT.split(','))

export async function uploadGhostMentorPhoto(
  mentorUserId: string,
  formData: FormData
): Promise<UploadResult> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose an image to upload.' }
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP.' }
  }
  if (file.size > GHOST_PHOTO_MAX_BYTES) {
    return { ok: false, error: 'Image must be 5 MB or smaller.' }
  }

  const ghost = await loadGhostForPhotoOps(auth.supabase, mentorUserId)
  if (!ghost.ok) return ghost

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${mentorUserId}/photo-${Date.now()}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  let service
  try {
    service = createServiceClient()
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : 'Server storage is not configured.',
    }
  }

  const { error: uploadError } = await service.storage
    .from('mentor-photos')
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const { data: publicUrlData } = service.storage
    .from('mentor-photos')
    .getPublicUrl(path)

  const { error: updateError } = await auth.supabase
    .from('mentor_profiles')
    .update({ photo_url: publicUrlData.publicUrl })
    .eq('user_id', mentorUserId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath('/admin/mentor-photos')
  revalidatePath('/mentors')
  revalidatePath(`/mentors/${mentorUserId}`)
  return { ok: true, photoUrl: publicUrlData.publicUrl }
}

export async function updateGhostMentorLinkedin({
  mentorUserId,
  linkedinInput,
}: {
  mentorUserId: string
  linkedinInput: string
}): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const ghost = await ensureGhostMentor(auth.supabase, mentorUserId)
  if (!ghost.ok) return ghost

  const linkedin_url = normalizeLinkedinUrl(linkedinInput)
  if (!linkedin_url) {
    return {
      ok: false,
      error: 'Enter a LinkedIn profile URL before completing this mentor.',
    }
  }

  const { error: updateError } = await auth.supabase
    .from('mentor_profiles')
    .update({ linkedin_url })
    .eq('user_id', mentorUserId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath('/admin/mentor-photos')
  revalidatePath(`/mentors/${mentorUserId}`)
  return { ok: true }
}

async function ensureGhostMentor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mentorUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('claim_status')
    .eq('user_id', mentorUserId)
    .maybeSingle<{ claim_status: string | null }>()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Mentor profile not found.' }
  if (data.claim_status !== 'ghost') {
    return { ok: false, error: 'Only ghost mentors can be updated here.' }
  }
  return { ok: true }
}

export async function updateGhostMentorEmail({
  mentorUserId,
  emailInput,
}: {
  mentorUserId: string
  emailInput: string
}): Promise<Result> {
  const auth = await ensureAdmin()
  if (!auth.ok) return auth

  const ghost = await ensureGhostMentor(auth.supabase, mentorUserId)
  if (!ghost.ok) return ghost

  const email = emailInput.trim().toLowerCase()
  if (!email) {
    return { ok: false, error: 'Enter an email address.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const { error: userError } = await auth.supabase
    .from('users')
    .update({ email })
    .eq('id', mentorUserId)

  if (userError) {
    if (userError.code === '23505') {
      return { ok: false, error: 'That email is already used by another account.' }
    }
    return { ok: false, error: userError.message }
  }

  try {
    const service = createServiceClient()
    const { error: authError } = await service.auth.admin.updateUserById(
      mentorUserId,
      { email }
    )
    if (authError) {
      console.error('[ghost-photo] auth email sync failed:', authError)
    }
  } catch (e) {
    console.error('[ghost-photo] auth email sync failed:', e)
  }

  revalidatePath('/admin/mentor-photos')
  return { ok: true }
}
