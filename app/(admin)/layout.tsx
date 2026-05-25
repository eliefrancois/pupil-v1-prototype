import Sidebar from '@/components/sidebar'
import { GHOST_PROFILE_QUEUE_OR_FILTER } from '@/lib/ghost-photos'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  let severeCount = 0
  let pendingMatchRequestsCount = 0
  let ghostPhotosNeededCount = 0
  if (user?.role === 'admin') {
    const supabase = createClient()
    const [flagsRes, requestsRes, ghostPhotosRes] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_flagged', true),
      supabase
        .from('match_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('mentor_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('claim_status', 'ghost')
        .or(GHOST_PROFILE_QUEUE_OR_FILTER),
    ])
    severeCount = flagsRes.count ?? 0
    pendingMatchRequestsCount = requestsRes.count ?? 0
    ghostPhotosNeededCount = ghostPhotosRes.count ?? 0
  }

  const badges: Record<string, number> = {}
  if (severeCount > 0) badges.flags = severeCount
  if (pendingMatchRequestsCount > 0) badges.matching = pendingMatchRequestsCount
  if (ghostPhotosNeededCount > 0) badges.mentorPhotos = ghostPhotosNeededCount

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        role="admin"
        user={user}
        badges={Object.keys(badges).length > 0 ? badges : undefined}
      />
      <main className="flex-1 min-w-0 overflow-y-auto bg-bg">{children}</main>
    </div>
  )
}
