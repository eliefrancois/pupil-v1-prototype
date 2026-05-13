'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Loader as Loader2,
  Lock,
  Mail,
  MailCheck,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandMark from '@/components/brand-mark'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmRequired, setConfirmRequired] = useState(false)

  const passwordsMatch = password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'student' } },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // public.users row is created automatically by the on_auth_user_created
      // trigger, so the client doesn't insert anything.
      if (!data.session) {
        setConfirmRequired(true)
        setLoading(false)
        return
      }

      router.push('/onboarding')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (confirmRequired) {
    return (
      <div className="w-full max-w-md px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex justify-center">
              <BrandMark size="md" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <MailCheck className="h-5 w-5" />
              </div>
              <h2 className="display text-[22px]">Check your email</h2>
              <p className="mt-2 text-[14px] text-text-2">
                We sent a confirmation link to{' '}
                <span className="font-medium text-text">{email}</span>. Click it
                to finish creating your account.
              </p>
              <p className="mt-4 text-[12px] text-text-3">
                Didn&apos;t get it? Check your spam folder or try again in a
                minute.
              </p>
              <Button variant="ghost" className="mt-6" asChild>
                <Link href="/login">Back to log in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-8 flex justify-center">
            <BrandMark size="md" />
          </div>

          <h2 className="display mb-2 text-center text-[24px]">
            Create your account
          </h2>
          <p className="mb-6 text-center text-[13px] text-text-2">
            Free to sign up. Browse mentors, no card required.
          </p>

          {error && (
            <div className="mb-4 rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 transition-colors hover:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Show
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
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
                  minLength={6}
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-text-2">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
