import Sidebar from '@/components/sidebar'
import { getCurrentUser } from '@/lib/supabase/get-user'

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role="mentor" user={user} />
      <main className="flex-1 min-w-0 overflow-y-auto bg-bg">{children}</main>
    </div>
  )
}
