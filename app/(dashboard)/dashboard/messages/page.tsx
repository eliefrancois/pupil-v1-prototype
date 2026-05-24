import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Lock, MessageCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UpgradeBanner from '@/components/upgrade-banner'
import ConversationView from '@/components/messaging/conversation-view'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor, getStudentProfile } from '@/lib/supabase/queries'
import { getOrCreateConversation, getMessages } from '@/lib/supabase/messaging'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/messages')

  const isPaid = user.subscription_status !== 'inactive'
  const profile = await getStudentProfile(user.id)
  const mentor = await getMatchedMentor(profile?.matched_mentor_id)

  if (!isPaid) {
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
          </div>

          <UpgradeBanner />

          <Card className="p-12 text-center">
            <CardContent className="flex flex-col items-center p-0">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-semibold text-text">
                Upgrade to message your mentor
              </p>
              <p className="mt-1 max-w-md text-[13px] text-text-2">
                Send messages between sessions, ask quick questions, share
                progress. All monitored for safety.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/pricing">
                  <MessageCircle className="h-4 w-4" />
                  Upgrade for $900/year
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!mentor || !profile?.matched_mentor_id) {
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
          <h1 className="display text-[28px] leading-tight">Messages</h1>
          <p className="text-[14px] text-text-2">
            You&apos;ll be able to message your mentor once you&apos;re matched.
          </p>
        </div>
      </div>
    )
  }

  const conversation = await getOrCreateConversation(user.id, profile.matched_mentor_id)
  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-2">Unable to load conversation. Please try again.</p>
      </div>
    )
  }

  const initialMessages = await getMessages(conversation.id)

  return (
    <div className="flex h-full flex-col">
      <ConversationView
        conversationId={conversation.id}
        currentUserId={user.id}
        otherParticipant={{
          id: mentor.user_id,
          name: mentor.full_name,
          photoUrl: mentor.photo_url,
          subtitle: `${mentor.university}${mentor.major ? ' · ' + mentor.major : ''}`,
        }}
        initialMessages={initialMessages}
      />
    </div>
  )
}
