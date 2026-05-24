'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Send, TriangleAlert, Shield, OctagonAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useRealtimeMessages, type RealtimeMessage } from '@/hooks/use-realtime-messages'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import { sendMessage } from '@/lib/actions/message-actions'

type Participant = {
  id: string
  name: string
  photoUrl?: string | null
  subtitle?: string
}

type Props = {
  conversationId: string
  currentUserId: string
  otherParticipant: Participant
  initialMessages: RealtimeMessage[]
  accentColor?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shouldShowDateSeparator(current: string, previous?: string): boolean {
  if (!previous) return true
  return new Date(current).toDateString() !== new Date(previous).toDateString()
}

export default function ConversationView({
  conversationId,
  currentUserId,
  otherParticipant,
  initialMessages,
  accentColor = '#7A60E4',
}: Props) {
  const { messages, addOptimistic, confirmOptimistic, replaceOptimistic } = useRealtimeMessages(conversationId, currentUserId, initialMessages)
  const [violationWarning, setViolationWarning] = useState<string | null>(null)
  const { typingText, sendTyping } = useTypingIndicator(conversationId, currentUserId, otherParticipant.name)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const optimisticId = `optimistic_${Date.now()}`
    const optimistic: RealtimeMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
      is_flagged: false,
      is_modified: false,
      flag_reason: null,
      created_at: new Date().toISOString(),
    }

    addOptimistic(optimistic)
    setInput('')

    startTransition(async () => {
      const result = await sendMessage({
        conversationId,
        content: text,
      })
      if (!result.ok) {
        console.error('[ConversationView] sendMessage failed:', result.error)
        return
      }

      if ('violation' in result) {
        replaceOptimistic(optimisticId, {
          id: result.messageId,
          content: '[This message was removed for violating community guidelines.]',
          is_flagged: true,
          is_modified: true,
          created_at: new Date().toISOString(),
        })
        const strikesLeft = 3 - result.violation.strikes
        setViolationWarning(
          strikesLeft > 0
            ? `Your message violated our community guidelines. ${result.violation.strikes}/3 strikes.`
            : `Your account has been flagged for review due to repeated violations.`
        )
        setTimeout(() => setViolationWarning(null), 8000)
      } else {
        confirmOptimistic(optimisticId, result.messageId)
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3">
        <Avatar
          src={otherParticipant.photoUrl}
          alt={otherParticipant.name}
          size="default"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {otherParticipant.name}
          </p>
          {otherParticipant.subtitle && (
            <p className="text-xs text-gray-500">{otherParticipant.subtitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-1">
          {/* Safety notice */}
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2">
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs text-blue-700">
              All messages are monitored for safety. Contact information is automatically removed.
            </span>
          </div>

          {messages.map((msg, idx) => {
            const isOwn = msg.sender_id === currentUserId
            const showDate = shouldShowDateSeparator(
              msg.created_at,
              messages[idx - 1]?.created_at
            )

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center py-3">
                    <span className="text-[11px] font-medium text-gray-400">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* System warning for modified messages */}
                {msg.is_modified && (
                  <div className="mb-1 flex justify-center">
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5">
                      <TriangleAlert className="h-3 w-3 text-yellow-600" />
                      <span className="text-[11px] text-yellow-700">
                        Message was modified — contact information removed.
                      </span>
                    </div>
                  </div>
                )}

                <div className={`mt-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                    style={isOwn ? { backgroundColor: accentColor } : undefined}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isOwn ? 'text-white/60' : 'text-gray-400'
                      }`}
                    >
                      {msg.id.startsWith('optimistic_') ? 'Sending...' : formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 px-6 py-3">
        <div className="mx-auto max-w-2xl">
          {violationWarning && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <OctagonAlert className="h-3.5 w-3.5 shrink-0 text-red-600" />
              <span className="text-xs text-red-700">{violationWarning}</span>
            </div>
          )}
          {typingText && (
            <p className="mb-1.5 text-[11px] text-gray-400 italic animate-pulse">
              {typingText}
            </p>
          )}
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                sendTyping()
              }}
              placeholder="Type a message..."
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1"
              disabled={isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              size="icon"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
