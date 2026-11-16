import crypto from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import { getSiteUrl } from '@/lib/site-url'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The only pages a login link may open. Settings, password, and email pages
 * are deliberately absent so a forwarded email can't reach them.
 */
const LOGIN_LINK_TARGETS = new Set([
  '/mentor',
  '/mentor/schedule',
  '/mentor/messages',
  '/mentor/mentees',
  '/mentor-onboarding',
  '/dashboard',
  '/dashboard/messages',
  '/dashboard/book',
  '/dashboard/mentor',
  '/onboarding',
])

export function isAllowedLinkTarget(path: string): boolean {
  return LOGIN_LINK_TARGETS.has(path)
}

export function hashLoginToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * A link that never stops working: it signs the user in once within
 * `loginDays`, and after that (or after first use) sends them through the
 * normal login page with their email filled in, then on to `targetPath`.
 */
export async function createLoginLink(
  supabase: SupabaseClient,
  {
    userId,
    targetPath,
    purpose,
    loginDays,
  }: { userId: string; targetPath: string; purpose: string; loginDays: number }
): Promise<string> {
  if (!isAllowedLinkTarget(targetPath)) {
    throw new Error(`Login links can't target ${targetPath}`)
  }
  const token = crypto.randomBytes(32).toString('base64url')
  const { error } = await supabase.from('login_link_tokens').insert({
    token_hash: hashLoginToken(token),
    user_id: userId,
    target_path: targetPath,
    purpose,
    login_expires_at: new Date(Date.now() + loginDays * DAY_MS).toISOString(),
  })
  if (error) throw new Error(error.message)
  return `${getSiteUrl()}/l/${token}`
}
