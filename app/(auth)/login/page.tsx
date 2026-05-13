import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import BrandMark from '@/components/brand-mark'

import LoginForm from './login-form'

export const metadata = {
  title: 'Log in | Pupil',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-md px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-8 flex justify-center">
            <BrandMark size="md" />
          </div>
          <div className="h-[280px] animate-pulse rounded-[var(--radius-sm)] bg-surface-2" />
        </CardContent>
      </Card>
    </div>
  )
}
