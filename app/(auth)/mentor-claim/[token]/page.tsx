import Link from 'next/link'
import Image from 'next/image'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { AlertCircle, CheckCircle2, GraduationCap, MapPin } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BrandMark from '@/components/brand-mark'

import ClaimForm from './claim-form'
import ExpiredActions from './expired-actions'

interface PageProps {
  params: { token: string }
}

interface MentorPreview {
  user_id: string
  email: string
  full_name: string
  university: string
  grad_year: number | null
  bio: string | null
  photo_url: string | null
  tags: string[]
  identity: {
    location?: { city: string; state: string } | null
  } | null
}

type PageState =
  | { kind: 'invalid' }
  | { kind: 'claimed'; email: string }
  | { kind: 'expired'; token: string; email: string }
  | { kind: 'ready'; token: string; mentor: MentorPreview }

async function loadState(token: string): Promise<PageState> {
  if (!token) return { kind: 'invalid' }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data } = await supabase
    .from('mentor_profiles')
    .select(
      `user_id,
       university,
       grad_year,
       bio,
       photo_url,
       tags,
       identity_json,
       claim_status,
       claim_token_expires_at,
       users!inner(email, full_name)`
    )
    .eq('claim_token', token)
    .maybeSingle<{
      user_id: string
      university: string
      grad_year: number | null
      bio: string | null
      photo_url: string | null
      tags: string[]
      identity_json: { location?: { city: string; state: string } | null } | null
      claim_status: string
      claim_token_expires_at: string | null
      users: { email: string; full_name: string }
    }>()

  if (!data) return { kind: 'invalid' }
  if (data.claim_status === 'claimed') {
    return { kind: 'claimed', email: data.users.email }
  }

  const expired =
    data.claim_token_expires_at !== null &&
    new Date(data.claim_token_expires_at) < new Date()
  if (expired) {
    return { kind: 'expired', token, email: data.users.email }
  }

  return {
    kind: 'ready',
    token,
    mentor: {
      user_id: data.user_id,
      email: data.users.email,
      full_name: data.users.full_name,
      university: data.university,
      grad_year: data.grad_year,
      bio: data.bio,
      photo_url: data.photo_url,
      tags: data.tags ?? [],
      identity: data.identity_json
        ? { location: data.identity_json.location ?? null }
        : null,
    },
  }
}

export default async function MentorClaimPage({ params }: PageProps) {
  const state = await loadState(params.token)

  if (state.kind === 'invalid') {
    return (
      <ClaimShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] text-[#B91C1C]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="display text-[22px]">This link doesn&apos;t work</h2>
          <p className="mt-2 text-[14px] text-text-2">
            We couldn&apos;t find a profile for this link. Double-check the URL
            from your email, or get in touch and we&apos;ll sort it out.
          </p>
          <div className="mt-6 flex flex-col gap-2 w-full">
            <Button asChild variant="outline">
              <Link href="/mentor-signup">Sign up as a mentor instead</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Already have an account? Log in</Link>
            </Button>
          </div>
        </div>
      </ClaimShell>
    )
  }

  if (state.kind === 'claimed') {
    return (
      <ClaimShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="display text-[22px]">You&apos;re already set up</h2>
          <p className="mt-2 text-[14px] text-text-2">
            This profile has already been claimed under{' '}
            <span className="font-medium text-text">{state.email}</span>. Log
            in to pick up where you left off.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </ClaimShell>
    )
  }

  if (state.kind === 'expired') {
    return (
      <ClaimShell>
        <ExpiredActions token={state.token} email={state.email} />
      </ClaimShell>
    )
  }

  // state.kind === 'ready'
  const { mentor, token } = state
  return (
    <ClaimShell wide>
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[12px] font-medium text-primary">
          <GraduationCap className="h-3.5 w-3.5" />
          Claim your mentor profile
        </span>
      </div>

      <h2 className="display mb-2 text-center text-[24px]">
        Welcome back, {firstName(mentor.full_name)}.
      </h2>
      <p className="mb-6 text-center text-[13px] text-text-2">
        We built a draft profile for you based on the survey you filled out a
        while back. Take a look. If it&apos;s yours, set a password to claim
        it.
      </p>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg-2 p-4 mb-6">
        <div className="flex items-start gap-4">
          {mentor.photo_url ? (
            <Image
              src={mentor.photo_url}
              alt={mentor.full_name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full bg-bg"
              unoptimized
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary-light" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[15px] text-text">
              {mentor.full_name}
            </p>
            <p className="text-[13px] text-text-2">
              {mentor.university}
              {mentor.grad_year ? ` '${String(mentor.grad_year).slice(-2)}` : ''}
            </p>
            {mentor.identity?.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-text-3">
                <MapPin className="h-3 w-3" />
                {mentor.identity.location.city}, {mentor.identity.location.state}
              </p>
            )}
          </div>
        </div>

        {mentor.bio && (
          <p className="mt-4 text-[13px] leading-relaxed text-text-2">
            {mentor.bio}
          </p>
        )}

        {mentor.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mentor.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-text-2 border border-border"
              >
                {tag}
              </span>
            ))}
            {mentor.tags.length > 6 && (
              <span className="text-[11px] text-text-3 self-center">
                +{mentor.tags.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      <ClaimForm token={token} email={mentor.email} />

      <p className="mt-6 text-center text-[12px] text-text-3">
        Not you?{' '}
        <Link href="/mentor-signup" className="text-primary hover:underline">
          Sign up fresh instead
        </Link>
        .
      </p>
    </ClaimShell>
  )
}

function ClaimShell({
  children,
  wide,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} px-4`}>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-8 flex justify-center">
            <BrandMark size="md" />
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? 'there'
}
