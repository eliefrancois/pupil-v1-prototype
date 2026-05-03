'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      return
    }

    const timer = setTimeout(() => {
      setStatus('success')
    }, 2000)

    return () => clearTimeout(timer)
  }, [searchParams])

  useEffect(() => {
    if (status === 'success') {
      const redirectTimer = setTimeout(() => {
        router.push('/onboarding')
      }, 2000)

      return () => clearTimeout(redirectTimer)
    }
  }, [status, router])

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12">
        {status === 'loading' && (
          <>
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#7A60E4]" />
            <h2 className="text-xl font-semibold text-gray-900">
              Verifying your payment...
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Payment confirmed!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting to onboarding...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              We couldn&apos;t verify your payment. Please contact us at{' '}
              <a
                href="mailto:dario@getpupil.com"
                className="text-[#7A60E4] hover:underline"
              >
                dario@getpupil.com
              </a>{' '}
              for assistance.
            </p>
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
        <Suspense fallback={
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#7A60E4]" />
              <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            </CardContent>
          </Card>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
