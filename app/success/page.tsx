import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CircleCheck, Clock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createServiceClient } from '@/lib/supabase/service'
import { BILLING_CONTACT_EMAIL, getStripe } from '@/lib/billing/stripe'
import { applyCheckoutSession } from '@/lib/billing/webhook'

import AutoRedirect from './auto-redirect'

export const dynamic = 'force-dynamic'

type CheckoutState = 'confirmed' | 'pending'

async function verifyCheckout(sessionId: string | undefined, userId: string): Promise<CheckoutState> {
  const stripe = getStripe()
  if (!stripe || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return 'pending'

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const owner = session.client_reference_id ?? session.metadata?.user_id
    if (owner !== userId || session.mode !== 'subscription') return 'pending'
    const paid =
      session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    if (session.status !== 'complete' || !paid) return 'pending'
    await applyCheckoutSession(createServiceClient(), session)
    return 'confirmed'
  } catch (err) {
    console.error('[success] checkout verification failed:', err)
    return 'pending'
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/success')

  const verified = await verifyCheckout(searchParams.session_id, user.id)
  const state: CheckoutState =
    verified === 'confirmed' || user.subscription_status === 'active' ? 'confirmed' : 'pending'

  const nextPath =
    user.role === 'student' && !user.onboarding_complete ? '/onboarding' : '/dashboard'
  const nextLabel = nextPath === '/onboarding' ? 'Finish signing up' : 'Go to your dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center px-8 py-12 text-center">
          {state === 'confirmed' ? (
            <>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
                <CircleCheck className="h-7 w-7" />
              </div>
              <h1 className="display text-[28px] leading-tight">You&apos;re subscribed</h1>
              <p className="mt-2 text-[14px] text-text-2">
                Thanks for joining Pupil. You can book up to 24 sessions a year and
                message your mentor anytime. A receipt is on its way to your email.
              </p>
              <Button className="mt-8" asChild>
                <Link href={nextPath}>{nextLabel}</Link>
              </Button>
              <AutoRedirect to={nextPath} delayMs={5000} />
            </>
          ) : (
            <>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-2">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="display text-[28px] leading-tight">Almost there</h1>
              <p className="mt-2 text-[14px] text-text-2">
                We haven&apos;t confirmed your payment yet. This usually takes a few
                seconds. If you finished checkout, refresh this page in a minute. Still
                stuck? Email{' '}
                <a
                  href={`mailto:${BILLING_CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {BILLING_CONTACT_EMAIL}
                </a>
                .
              </p>
              <Button variant="outline" className="mt-8" asChild>
                <Link href={nextPath}>{nextLabel}</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
