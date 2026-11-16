'use server'

import { revalidatePath } from 'next/cache'

import { setUnsubscribed } from '@/lib/email/preferences'
import { createServiceClient } from '@/lib/supabase/service'

async function update(formData: FormData, unsubscribed: boolean) {
  const token = formData.get('token')
  if (typeof token !== 'string' || !token) return
  await setUnsubscribed(createServiceClient(), token, unsubscribed)
  revalidatePath('/unsubscribe')
}

export async function unsubscribeFromReminders(formData: FormData) {
  await update(formData, true)
}

export async function resubscribeToReminders(formData: FormData) {
  await update(formData, false)
}
