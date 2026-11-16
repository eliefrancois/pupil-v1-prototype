import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { hashLoginToken, isAllowedLinkTarget } from '@/lib/auth/login-links'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type CookieToSet = { name: string; value: string; options: CookieOptions }

interface LinkRow {
  id: string
  user_id: string
  target_path: string
  login_expires_at: string
  used_at: string | null
}

/**
 * Reminder email button. Signs the user in once while the link is fresh,
 * otherwise sends them to /login with their email filled in. Either way
 * they land on the link's target page.
 */
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const pendingCookies: CookieToSet[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: CookieToSet[]) => {
          pendingCookies.push(...cookies)
        },
      },
    }
  )
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url))
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options)
    }
    return response
  }

  const service = createServiceClient()
  const { data: link } = await service
    .from('login_link_tokens')
    .select('id, user_id, target_path, login_expires_at, used_at')
    .eq('token_hash', hashLoginToken(params.token))
    .maybeSingle<LinkRow>()
  if (!link) return redirectTo('/login')

  const target = isAllowedLinkTarget(link.target_path) ? link.target_path : '/dashboard'
  const {
    data: { user: current },
  } = await supabase.auth.getUser()
  if (current?.id === link.user_id) return redirectTo(target)

  const { data: account } = await service
    .from('users')
    .select('email')
    .eq('id', link.user_id)
    .maybeSingle<{ email: string | null }>()
  if (!account?.email) return redirectTo('/login')

  const loginFallback = async () => {
    if (current) await supabase.auth.signOut({ scope: 'local' })
    const params = new URLSearchParams({ email: account.email ?? '', next: target })
    return redirectTo(`/login?${params.toString()}`)
  }

  const nowIso = new Date().toISOString()
  if (link.used_at || link.login_expires_at <= nowIso) return loginFallback()

  const { data: claimed } = await service
    .from('login_link_tokens')
    .update({ used_at: nowIso })
    .eq('id', link.id)
    .is('used_at', null)
    .gt('login_expires_at', nowIso)
    .select('id')
  if (!claimed?.length) return loginFallback()

  const { data: generated, error: linkError } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: account.email,
  })
  const tokenHash = generated?.properties?.hashed_token
  if (linkError || !tokenHash) return loginFallback()

  if (current) await supabase.auth.signOut({ scope: 'local' })
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })
  if (verifyError) return loginFallback()

  return redirectTo(target)
}

/** Link scanners often send HEAD first; answer without spending the login. */
export function HEAD() {
  return new NextResponse(null, { status: 200 })
}
