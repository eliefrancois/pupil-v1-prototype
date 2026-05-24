import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import FlagsClient from './client'

export type FlaggedMessage = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_strikes: number
  sender_status: string
  content: string
  original_content: string | null
  flag_reason: string | null
  flag_tier: 1 | 2 | 3 | null
  is_modified: boolean
  created_at: string
}

export type FlagStats = {
  total: number
  tier1: number
  tier2: number
  tier3: number
}

export default async function FlagsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/')

  const supabase = createClient()

  const { data: flagged } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, original_content, flag_reason, flag_tier, is_modified, created_at')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(200)

  // Resolve sender names + moderation info
  const senderIds = Array.from(
    new Set((flagged ?? []).map((m) => m.sender_id))
  )
  let senderMap: Record<string, { name: string; strikes: number; status: string }> = {}
  if (senderIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, moderation_strikes, moderation_status')
      .in('id', senderIds)
    senderMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.id,
        {
          name: u.full_name ?? 'Unknown',
          strikes: u.moderation_strikes ?? 0,
          status: u.moderation_status ?? 'active',
        },
      ])
    )
  }

  const flags: FlaggedMessage[] = (flagged ?? []).map((m) => {
    const sender = senderMap[m.sender_id]
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      sender_name: sender?.name ?? 'Unknown',
      sender_strikes: sender?.strikes ?? 0,
      sender_status: sender?.status ?? 'active',
      content: m.original_content ?? m.content,
      original_content: m.original_content,
      flag_reason: m.flag_reason,
      flag_tier: m.flag_tier ?? null,
      is_modified: m.is_modified ?? false,
      created_at: m.created_at,
    }
  })

  const stats: FlagStats = {
    total: flags.length,
    tier1: flags.filter((f) => f.flag_tier === 1).length,
    tier2: flags.filter((f) => f.flag_tier === 2).length,
    tier3: flags.filter((f) => f.flag_tier === 3).length,
  }

  return <FlagsClient flags={flags} stats={stats} />
}
