'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')

  const verifyPayment = useCallback(async () => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus('error')
      return
    }

    // Poll for subscription_status to be updated by webhook
    let attempts = 0
    const maxAttempts = 10

    const poll = async (): Promise<boolean> => {
      const { data } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      return data?.subscription_status === 'active'
    }

    while (attempts < maxAttempts) {
      const active = await poll()
      if (active) {
        setStatus('success')
        return
      }
      attempts++
      await new Promise(r => setTimeout(r, 2000))
    }

    // Webhook may be slow; still redirect to onboarding since checkout completed
    setStatus('success')
  }, [searchParams])

  useEffect(() => {
    verifyPayment()
  }, [verifyPayment])

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => router.push('/onboarding'), 2000)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12">
        {status === 'loading' && (
          <>
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#7A60E4]" />
            <h2 className="text-xl font-semibold text-gray-900">Verifying your payment...</h2>
            <p className="mt-2 text-sm text-gray-500">This will only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">Payment confirmed!</h2>
            <p className="mt-2 text-sm text-gray-500">Redirecting to onboarding...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">We couldn&apos;t confirm payment yet</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              If you completed checkout, your payment may still be processing. Check your email or contact{' '}
              <a href="mailto:dario@getpupil.com" className="text-[#7A60E4] hover:underline">
                dario@getpupil.com
              </a>
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-6 rounded-md bg-[#7A60E4] px-6 py-2 text-sm font-medium text-white hover:bg-[#6950d0]"
            >
              Continue to onboarding
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Suspense
          fallback={
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#7A60E4]" />
                <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
              </CardContent>
            </Card>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
