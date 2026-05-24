import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { getConversationsForUser, getMessages } from '@/lib/supabase/messaging'
import { createClient } from '@/lib/supabase/server'
import MentorMessagesClient from './client'

export type ConversationWithParticipant = {
  id: string
  participantId: string
  participantName: string
  participantPhoto: string | null
  participantSubtitle: string
  lastMessageAt: string | null
}

export default async function MentorMessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mentor/messages')

  const conversations = await getConversationsForUser(user.id)

  // Resolve participant names for the conversation list
  const supabase = createClient()
  const otherIds = conversations.map((c) =>
    c.participant_ids.find((id) => id !== user.id)!
  ).filter(Boolean)

  let participantMap: Record<string, { full_name: string; photo_url: string | null }> = {}
  if (otherIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', otherIds)

    const { data: students } = await supabase
      .from('student_profiles')
      .select('user_id, grade, city, state')
      .in('user_id', otherIds)

    const studentMap = Object.fromEntries(
      (students ?? []).map((s) => [s.user_id, s])
    )

    participantMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.id,
        {
          full_name: u.full_name ?? 'Student',
          photo_url: null,
        },
      ])
    )

    // Enrich subtitle
    for (const id of otherIds) {
      const student = studentMap[id]
      if (student && participantMap[id]) {
        ;(participantMap[id] as any).subtitle = [
          student.city,
          student.state,
          student.grade ? `Grade ${student.grade}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      }
    }
  }

  const conversationList: ConversationWithParticipant[] = conversations.map((c) => {
    const otherId = c.participant_ids.find((id) => id !== user.id)!
    const p = participantMap[otherId]
    return {
      id: c.id,
      participantId: otherId,
      participantName: p?.full_name ?? 'Student',
      participantPhoto: p?.photo_url ?? null,
      participantSubtitle: (p as any)?.subtitle ?? '',
      lastMessageAt: c.last_message_at,
    }
  })

  // Load messages for the first conversation (if any)
  const activeConversation = conversationList[0] ?? null
  const initialMessages = activeConversation
    ? await getMessages(activeConversation.id)
    : []

  return (
    <MentorMessagesClient
      currentUserId={user.id}
      conversations={conversationList}
      activeConversationId={activeConversation?.id ?? null}
      initialMessages={initialMessages}
    />
  )
}
