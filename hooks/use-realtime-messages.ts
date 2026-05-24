'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type RealtimeMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_flagged: boolean
  is_modified: boolean
  flag_reason: string | null
  created_at: string
}

/**
 * Hook that subscribes to a conversation's broadcast channel and delivers
 * real-time messages. Also provides initial message loading.
 *
 * Uses Broadcast from Database pattern:
 * - DB trigger fires realtime.broadcast_changes() on INSERT
 * - Client subscribes to private channel 'conversation:<id>'
 *
 * For the sender's own messages:
 * - Optimistic message shown immediately ("Sending...")
 * - Server action returns the real messageId → confirmOptimistic swaps it in
 * - If the broadcast also arrives, it's deduped via seenIds
 */
export function useRealtimeMessages(
  conversationId: string | null,
  currentUserId: string,
  initialMessages: RealtimeMessage[] = []
) {
  const [messages, setMessages] = useState<RealtimeMessage[]>(initialMessages)
  const seenIds = useRef(new Set(initialMessages.map((m) => m.id)))
  const supabase = createClient()

  // Reset when conversation changes
  useEffect(() => {
    setMessages(initialMessages)
    seenIds.current = new Set(initialMessages.map((m) => m.id))
  }, [conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!conversationId) return

    const channelName = `conversation:${conversationId}`

    const channel = supabase
      .channel(channelName, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        // broadcast_changes payload: payload.payload contains the row fields
        // Try multiple possible structures from broadcast_changes
        const record = (payload.payload?.record ?? payload.payload) as
          | RealtimeMessage
          | undefined
        if (!record?.id) return
        if (seenIds.current.has(record.id)) return

        seenIds.current.add(record.id)

        // If from current user, replace optimistic; otherwise append
        if (record.sender_id === currentUserId) {
          setMessages((prev) => {
            const optimisticIdx = prev.findIndex(
              (m) => m.id.startsWith('optimistic_') && m.sender_id === currentUserId
            )
            if (optimisticIdx !== -1) {
              const next = [...prev]
              next[optimisticIdx] = record
              return next
            }
            return [...prev, record]
          })
        } else {
          setMessages((prev) => [...prev, record])
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await supabase.realtime.setAuth()
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, supabase])

  const addOptimistic = useCallback(
    (msg: RealtimeMessage) => {
      seenIds.current.add(msg.id)
      setMessages((prev) => [...prev, msg])
    },
    []
  )

  /**
   * Called after server action confirms the message was inserted.
   * Replaces the optimistic placeholder (by optimisticId) with the real ID
   * and confirmed timestamp, so "Sending..." → actual time.
   */
  const confirmOptimistic = useCallback(
    (optimisticId: string, realId: string) => {
      seenIds.current.add(realId)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...m, id: realId, created_at: new Date().toISOString() }
            : m
        )
      )
    },
    []
  )

  /**
   * Replace an optimistic message with updated content (e.g. violation notice).
   */
  const replaceOptimistic = useCallback(
    (optimisticId: string, updates: Partial<RealtimeMessage>) => {
      if (updates.id) seenIds.current.add(updates.id)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, ...updates } : m
        )
      )
    },
    []
  )

  return { messages, addOptimistic, confirmOptimistic, replaceOptimistic }
}
