import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Construction, Lock, MessageCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UpgradeBanner from '@/components/upgrade-banner'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor, getStudentProfile } from '@/lib/supabase/queries'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/messages')

  const isPaid = user.subscription_status !== 'inactive'
  const profile = await getStudentProfile(user.id)
  const mentor = await getMatchedMentor(profile?.matched_mentor_id)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div>
          <h1 className="display text-[28px] leading-tight">Messages</h1>
          {mentor && (
            <p className="mt-1 text-[14px] text-text-2">
              With {mentor.full_name}
            </p>
          )}
        </div>

        {!isPaid && <UpgradeBanner />}

        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center p-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              {isPaid ? (
                <Construction className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
            <p className="text-[15px] font-semibold text-text">
              {isPaid ? 'Messaging is coming soon' : 'Upgrade to message your mentor'}
            </p>
            <p className="mt-1 max-w-md text-[13px] text-text-2">
              {isPaid
                ? 'Real-time chat with your mentor is on the way. All messages are monitored for safety. For now, your mentor will reach out via email.'
                : 'Send messages between sessions, ask quick questions, share progress. All monitored for safety.'}
            </p>
            {!isPaid && (
              <Button className="mt-6" asChild>
                <Link href="/pricing">
                  <MessageCircle className="h-4 w-4" />
                  Upgrade for $900/year
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
