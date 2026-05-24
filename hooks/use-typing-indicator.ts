'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TYPING_TIMEOUT_MS = 3000
const DEBOUNCE_MS = 500

/**
 * Ephemeral typing indicator over Broadcast.
 * Sends "typing" events on the same conversation channel.
 * No DB persistence — purely WebSocket.
 */
export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string,
  otherParticipantName: string
) {
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef(0)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const channelName = `typing:${conversationId}`

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const senderId = payload.payload?.user_id as string | undefined
        if (!senderId || senderId === currentUserId) return

        setIsOtherTyping(true)

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false)
        }, TYPING_TIMEOUT_MS)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [conversationId, currentUserId, supabase])

  const sendTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastSentRef.current < DEBOUNCE_MS) return
    lastSentRef.current = now

    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    })
  }, [currentUserId])

  return {
    isOtherTyping,
    typingText: isOtherTyping ? `${otherParticipantName} is typing...` : null,
    sendTyping,
  }
}
