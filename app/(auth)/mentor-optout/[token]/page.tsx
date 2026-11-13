import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

import BrandMark from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/service'

import { removeImportedProfile } from './actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { token: string }
}

export default async function MentorOptOutPage({ params }: PageProps) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('mentor_profiles')
    .select('claim_status, users:users!mentor_profiles_user_id_fkey!inner(email)')
    .eq('claim_optout_token', params.token)
    .maybeSingle<{ claim_status: string | null; users: { email: string } }>()

  if (!data) {
    return (
      <OptOutShell>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] text-[#B91C1C]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="display text-[22px]">This link doesn&apos;t work</h2>
        <p className="mt-2 text-[14px] text-text-2">
          Reply to the email you got from us and we&apos;ll take care of it.
        </p>
      </OptOutShell>
    )
  }

  if (data.claim_status === 'claimed') {
    return (
      <OptOutShell>
        <h2 className="display text-[22px]">You&apos;ve already claimed this profile</h2>
        <p className="mt-2 text-[14px] text-text-2">
          Log in to pause or update your profile from your dashboard.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Log in</Link>
        </Button>
      </OptOutShell>
    )
  }

  if (data.claim_status !== 'ghost' && data.claim_status !== 'claim_pending') {
    return (
      <OptOutShell>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="display text-[22px]">Your profile is removed</h2>
        <p className="mt-2 text-[14px] text-text-2">
          It&apos;s off the Pupil mentor directory and we won&apos;t email{' '}
          <span className="font-medium text-text">{data.users.email}</span> about
          it again.
        </p>
      </OptOutShell>
    )
  }

  return (
    <OptOutShell>
      <h2 className="display text-[22px]">Remove your mentor profile?</h2>
      <p className="mt-2 text-[14px] text-text-2">
        We&apos;ll take the draft profile for{' '}
        <span className="font-medium text-text">{data.users.email}</span> off the
        Pupil mentor directory and stop emailing you about it.
      </p>
      <form action={removeImportedProfile} className="mt-6 w-full">
        <input type="hidden" name="token" value={params.token} />
        <Button type="submit" className="w-full">
          Remove my profile
        </Button>
      </form>
    </OptOutShell>
  )
}

function OptOutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-8 flex justify-center">
            <BrandMark size="md" />
          </div>
          <div className="flex flex-col items-center text-center">{children}</div>
        </CardContent>
      </Card>
    </div>
  )
}
