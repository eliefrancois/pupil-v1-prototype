import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import FlagsClient from './client'

export type ParticipantRole = 'student' | 'mentor' | 'admin' | 'parent' | 'unknown'

export type FlaggedMessage = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role: ParticipantRole
  sender_strikes: number
  sender_status: string
  recipient_name: string
  recipient_role: ParticipantRole
  content: string
  original_content: string | null
  flag_reason: string | null
  flag_tier: 1 | 2 | 3 | null
  is_modified: boolean
  admin_action: 'blocked' | 'released' | null
  created_at: string
}

export type FlagStats = {
  total: number
  tier1: number
  tier2: number
  tier3: number
}

type RawMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  original_content: string | null
  flag_reason: string | null
  flag_tier: number | null
  is_modified: boolean | null
  admin_action: string | null
  created_at: string
}

type UserSummary = {
  id: string
  full_name: string | null
  role: string | null
  moderation_strikes: number | null
  moderation_status: string | null
}

type ConversationSummary = {
  id: string
  participant_ids: string[]
}

function normalizeRole(role: string | null | undefined): ParticipantRole {
  if (role === 'student' || role === 'mentor' || role === 'admin' || role === 'parent') {
    return role
  }
  return 'unknown'
}

function normalizeAdminAction(
  value: string | null | undefined
): FlaggedMessage['admin_action'] {
  if (value === 'blocked' || value === 'released') return value
  return null
}

function normalizeTier(value: number | null | undefined): 1 | 2 | 3 | null {
  if (value === 1 || value === 2 || value === 3) return value
  return null
}

async function resolveFlaggedMessages(
  supabase: ReturnType<typeof createClient>,
  rows: RawMessage[]
): Promise<FlaggedMessage[]> {
  if (rows.length === 0) return []

  const conversationIds = Array.from(new Set(rows.map((m) => m.conversation_id)))
  const senderIds = Array.from(new Set(rows.map((m) => m.sender_id)))

  const [convRes, senderRes] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, participant_ids')
      .in('id', conversationIds),
    supabase
      .from('users')
      .select('id, full_name, role, moderation_strikes, moderation_status')
      .in('id', senderIds),
  ])

  const conversationsById = new Map<string, ConversationSummary>(
    (convRes.data ?? []).map((c) => [c.id, c as ConversationSummary])
  )

  const senderMap = new Map<string, UserSummary>(
    (senderRes.data ?? []).map((u) => [u.id, u as UserSummary])
  )

  // Collect all recipient IDs from the participant arrays (everyone who isn't
  // the sender of a given message).
  const recipientIds = new Set<string>()
  for (const row of rows) {
    const conv = conversationsById.get(row.conversation_id)
    if (!conv) continue
    for (const pid of conv.participant_ids) {
      if (pid !== row.sender_id) recipientIds.add(pid)
    }
  }

  const recipientMap = new Map<string, UserSummary>()
  if (recipientIds.size > 0) {
    const { data: recipients } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('id', Array.from(recipientIds))
    for (const u of recipients ?? []) {
      recipientMap.set(u.id, u as UserSummary)
    }
  }

  return rows.map((m) => {
    const sender = senderMap.get(m.sender_id)
    const conv = conversationsById.get(m.conversation_id)
    const recipientId =
      conv?.participant_ids.find((id) => id !== m.sender_id) ?? null
    const recipient = recipientId ? recipientMap.get(recipientId) : undefined

    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      sender_name: sender?.full_name ?? 'Unknown user',
      sender_role: normalizeRole(sender?.role),
      sender_strikes: sender?.moderation_strikes ?? 0,
      sender_status: sender?.moderation_status ?? 'active',
      recipient_name: recipient?.full_name ?? 'Unknown',
      recipient_role: normalizeRole(recipient?.role),
      content: m.original_content ?? m.content,
      original_content: m.original_content,
      flag_reason: m.flag_reason,
      flag_tier: normalizeTier(m.flag_tier),
      is_modified: m.is_modified ?? false,
      admin_action: normalizeAdminAction(m.admin_action),
      created_at: m.created_at,
    }
  })
}

export default async function FlagsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/')

  const supabase = createClient()

  // Pending: flagged messages an admin has not yet acted on.
  const { data: pendingRaw } = await supabase
    .from('messages')
    .select(
      'id, conversation_id, sender_id, content, original_content, flag_reason, flag_tier, is_modified, admin_action, created_at'
    )
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(200)

  // Resolved: messages where an admin has taken action (released or confirmed
  // block). We use admin_action presence and is_flagged=false as the marker —
  // a message gets is_flagged=false once an admin resolves it.
  const { data: resolvedRaw } = await supabase
    .from('messages')
    .select(
      'id, conversation_id, sender_id, content, original_content, flag_reason, flag_tier, is_modified, admin_action, created_at'
    )
    .eq('is_flagged', false)
    .not('admin_action', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  const [pending, resolved] = await Promise.all([
    resolveFlaggedMessages(supabase, (pendingRaw ?? []) as RawMessage[]),
    resolveFlaggedMessages(supabase, (resolvedRaw ?? []) as RawMessage[]),
  ])

  const stats: FlagStats = {
    total: pending.length,
    tier1: pending.filter((f) => f.flag_tier === 1).length,
    tier2: pending.filter((f) => f.flag_tier === 2).length,
    tier3: pending.filter((f) => f.flag_tier === 3).length,
  }

  return <FlagsClient pending={pending} resolved={resolved} stats={stats} />
}
