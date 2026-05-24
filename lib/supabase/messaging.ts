'use server'

import { createClient } from '@/lib/supabase/server'

export type Conversation = {
  id: string
  participant_ids: string[]
  last_message_at: string | null
  created_at: string
}

export type Message = {
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
 * Lazily creates or retrieves an existing conversation between two users.
 * Idempotent: checks for existing conversation with same participant pair first.
 */
export async function getOrCreateConversation(
  studentId: string,
  mentorId: string
): Promise<Conversation | null> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [studentId, mentorId])
    .maybeSingle<Conversation>()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_ids: [studentId, mentorId] })
    .select()
    .single<Conversation>()

  if (error) {
    // Race condition: another request created it between our check and insert
    if (error.code === '23505') {
      const { data: raced } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [studentId, mentorId])
        .maybeSingle<Conversation>()
      return raced
    }
    console.error('[messaging] getOrCreateConversation error:', error)
    return null
  }

  return created
}

/**
 * Get conversation by ID (for pages that already know the conversation ID).
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle<Conversation>()
  return data
}

/**
 * List all conversations for a given user, ordered by most recent message.
 */
export async function getConversationsForUser(
  userId: string
): Promise<Conversation[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false, nullsFirst: false })

  return (data as Conversation[]) ?? []
}

/**
 * Load the most recent N messages for a conversation, ordered oldest-first
 * for display (we fetch DESC then reverse).
 * Excludes messages that an admin has blocked.
 */
export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<Message[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .or('admin_action.is.null,admin_action.neq.blocked')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []
  return (data as Message[]).reverse()
}
