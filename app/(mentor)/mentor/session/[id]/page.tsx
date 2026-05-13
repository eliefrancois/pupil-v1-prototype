import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getCurrentUser } from '@/lib/supabase/get-user'
import { getBookingDetail } from '@/lib/supabase/queries'

import SessionDetail from '@/app/(dashboard)/dashboard/session/[id]/session-detail'

export default async function MentorSessionPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/mentor/session/${params.id}`)
  if (user.role !== 'mentor') {
    redirect(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  const booking = await getBookingDetail(params.id, user.id)
  if (!booking) notFound()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <Link
          href="/mentor"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <SessionDetail booking={booking} backHref="/mentor" />
      </div>
    </div>
  )
}
