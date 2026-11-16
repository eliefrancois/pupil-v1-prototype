import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import ConversationView from '@/components/messaging/conversation-view'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor } from '@/lib/supabase/queries'
import { getOrCreateConversation, getMessages } from '@/lib/supabase/messaging'
import { getStudentEntitlements } from '@/lib/entitlements'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/messages')

  const entitlements = await getStudentEntitlements(user.id)
  const mentor = await getMatchedMentor(entitlements.mentorId)

  if (!entitlements.canMessage || !entitlements.mentorId || !mentor) {
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
            Messaging is free.
          </p>
        </div>
      </div>
    )
  }

  const conversation = await getOrCreateConversation(user.id, entitlements.mentorId)
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
