'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import ConversationView from '@/components/messaging/conversation-view'
import type { RealtimeMessage } from '@/hooks/use-realtime-messages'
import type { ConversationWithParticipant } from './page'

type Props = {
  currentUserId: string
  conversations: ConversationWithParticipant[]
  activeConversationId: string | null
  initialMessages: RealtimeMessage[]
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MentorMessagesClient({
  currentUserId,
  conversations,
  activeConversationId,
  initialMessages,
}: Props) {
  const [activeId, setActiveId] = useState(activeConversationId)

  const activeConv = conversations.find((c) => c.id === activeId) ?? null

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <MessageCircle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No conversations yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Messages with your mentees will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Conversation list sidebar */}
      <div className="flex w-72 flex-col border-r border-gray-200 bg-gray-50/50">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-100 ${
                conv.id === activeId ? 'bg-white' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={conv.participantPhoto}
                  alt={conv.participantName}
                  size="default"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {conv.participantName}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  {conv.participantSubtitle && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conv.participantSubtitle}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className="flex flex-1 flex-col">
        {activeConv ? (
          <ConversationView
            conversationId={activeConv.id}
            currentUserId={currentUserId}
            otherParticipant={{
              id: activeConv.participantId,
              name: activeConv.participantName,
              photoUrl: activeConv.participantPhoto,
              subtitle: activeConv.participantSubtitle,
            }}
            initialMessages={activeId === activeConversationId ? initialMessages : []}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
