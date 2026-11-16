import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-user'

import ApplicationRow, { type EligibilityApplicationItem } from './application-row'

export const dynamic = 'force-dynamic'

export default async function EligibilityPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/eligibility')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">Admins only</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('eligibility_applications')
    .select(
      'id, student_name, parent_name, email, student_email, grade, school, eligibility_type, counselor_email, counselor_status, counselor_emailed_at, status, granted_user_id, created_at, reviewed_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<EligibilityApplicationItem[]>()

  if (error) {
    console.error('[admin/eligibility] failed to load applications', error)
  }

  const applications = data ?? []
  const pendingCount = applications.filter(
    (a) => (a.status ?? 'pending') === 'pending'
  ).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Eligibility review</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pendingCount} pending · {applications.length} total. Approve once
            the counselor confirms by replying to the email.
          </p>
        </div>

        {error ? (
          <div className="py-16 text-center text-sm text-red-600">
            Couldn&apos;t load applications. Check the server logs.
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No applications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
