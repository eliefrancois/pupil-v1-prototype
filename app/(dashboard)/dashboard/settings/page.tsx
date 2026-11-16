import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ManageBillingButton from '@/components/billing/manage-billing-button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { planFromStatus, type Plan } from '@/lib/entitlements'

import SettingsForm from './settings-form'

const PLAN_LABELS: Record<Plan, string> = {
  subscribed: 'Subscribed',
  free_access: 'Free access',
  none: 'Not subscribed',
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/settings')

  const plan = planFromStatus(user.subscription_status)
  const { data: billing } = await createClient()
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div>
          <h1 className="display text-[28px] leading-tight">Settings</h1>
          <p className="mt-1 text-[14px] text-text-2">
            Account, notifications, and privacy
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm
              initialFullName={user.full_name || ''}
              email={user.email}
            />
          </CardContent>
        </Card>

        {(user.role === 'student' || user.role === 'parent') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-2">Status</span>
                <span className="text-[14px] font-medium text-text">
                  {PLAN_LABELS[plan]}
                </span>
              </div>
              {plan === 'none' && (
                <>
                  <p className="text-[13px] text-text-2">
                    Messaging and your first session are free. Subscribe for
                    $99/month to book up to 24 sessions a year.
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/pricing">See the plan</Link>
                  </Button>
                </>
              )}
              {plan === 'free_access' && (
                <p className="text-[13px] text-text-3">
                  Your family qualified for free access. Questions? Email{' '}
                  <a
                    href="mailto:support@getpupil.com"
                    className="text-primary hover:underline"
                  >
                    support@getpupil.com
                  </a>
                  .
                </p>
              )}
              {plan === 'subscribed' &&
                (billing?.stripe_customer_id ? (
                  <>
                    <p className="text-[13px] text-text-2">
                      Update your card, download receipts, or cancel anytime.
                    </p>
                    <ManageBillingButton />
                  </>
                ) : (
                  <p className="text-[13px] text-text-3">
                    To cancel or change your plan, email{' '}
                    <a
                      href="mailto:support@getpupil.com"
                      className="text-primary hover:underline"
                    >
                      support@getpupil.com
                    </a>
                    .
                  </p>
                ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[13px] text-text-2">
              To delete your account, email{' '}
              <a
                href="mailto:support@getpupil.com?subject=Delete%20my%20account"
                className="text-primary hover:underline"
              >
                support@getpupil.com
              </a>
              . We&apos;ll remove your data within 30 days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
