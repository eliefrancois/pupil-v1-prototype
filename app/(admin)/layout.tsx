import Sidebar from '@/components/sidebar'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Fetch counts for sidebar badges (unreviewed severe flags + open match
  // requests waiting on admin action). Run in parallel so we don't pay two
  // round-trips on every admin page render.
  let severeCount = 0
  let pendingRequestsCount = 0
  if (user?.role === 'admin') {
    const supabase = createClient()
    const [flagsRes, requestsRes] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_flagged', true)
        .gte('flag_tier', 2),
      supabase
        .from('match_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])
    severeCount = flagsRes.count ?? 0
    pendingRequestsCount = requestsRes.count ?? 0
  }

  const badges: Record<string, number> = {}
  if (severeCount > 0) badges.flags = severeCount
  if (pendingRequestsCount > 0) badges.requests = pendingRequestsCount

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
