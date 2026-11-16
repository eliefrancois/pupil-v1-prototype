'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRedirect({ to, delayMs }: { to: string; delayMs: number }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push(to), delayMs)
    return () => clearTimeout(timer)
  }, [router, to, delayMs])

  return null
}
