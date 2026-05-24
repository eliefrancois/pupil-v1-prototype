'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader as Loader2, Lock, Mail } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { claimProfile } from './actions'

export default function ClaimForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordsMatch = password.length > 0 && password === confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.')
      return
    }

    setLoading(true)

    const result = await claimProfile(token, password)
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Server has confirmed the email and set the password. Sign in
    // with the same credentials to establish a browser session.
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: result.email,
      password,
    })

    if (signInErr) {
      // Account is created and password is correct on the auth side;
      // a sign-in failure here is almost certainly transient. Send the
      // mentor to /login with a hint instead of looping them.
      router.push('/login?claimed=1')
      return
    }

    // Send them into mentor onboarding so they can verify the
    // imported bio, add availability, and confirm matching preferences.
    router.push('/mentor-onboarding?claimed=1')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            className="pl-10 bg-bg-2 text-text-2 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Set a password</Label>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 transition-colors hover:text-primary"
          >
            {showPassword ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Show
              </>
            )}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            minLength={8}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-type your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            minLength={8}
            required
          />
        </div>
        {confirmPassword.length > 0 && (
          <p
            className={`text-[12px] ${
              passwordsMatch ? 'text-success' : 'text-text-3'
            }`}
          >
            {passwordsMatch
              ? 'Passwords match.'
              : 'Passwords don\u2019t match yet.'}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming your profile...
          </>
        ) : (
          'Claim profile and continue'
        )}
      </Button>
    </form>
  )
}
