import { AlertCircle, CheckCircle2 } from 'lucide-react'

import BrandMark from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/service'

import { resubscribeToReminders, unsubscribeFromReminders } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Email preferences | Pupil',
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token ?? ''
  const { data } = token
    ? await createServiceClient()
        .from('email_preferences')
        .select('unsubscribed_at')
        .eq('unsubscribe_token', token)
        .maybeSingle<{ unsubscribed_at: string | null }>()
    : { data: null }

  if (!data) {
    return (
      <Shell>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] text-[#B91C1C]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="display text-[22px]">This link doesn&apos;t work</h2>
        <p className="mt-2 text-[14px] text-text-2">
          Reply to any email from us with &quot;unsubscribe&quot; and we&apos;ll take care of it.
        </p>
      </Shell>
    )
  }

  if (data.unsubscribed_at) {
    return (
      <Shell>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="display text-[22px]">You&apos;re unsubscribed</h2>
        <p className="mt-2 text-[14px] text-text-2">
          No more reminder emails. You&apos;ll still get emails about your matches and
          booked sessions.
        </p>
        <form action={resubscribeToReminders} className="mt-6 w-full">
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="ghost" className="w-full">
            Turn reminders back on
          </Button>
        </form>
      </Shell>
    )
  }

  return (
    <Shell>
      <h2 className="display text-[22px]">Stop reminder emails?</h2>
      <p className="mt-2 text-[14px] text-text-2">
        We&apos;ll stop sending reminders like &quot;finish your profile&quot; or &quot;say hi
        to your mentor.&quot; Emails about your matches and booked sessions still come
        through.
      </p>
      <form action={unsubscribeFromReminders} className="mt-6 w-full">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" className="w-full">
          Unsubscribe from reminders
        </Button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
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
