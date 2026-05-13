'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader as Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SettingsFormProps {
  initialFullName: string
  email: string
}

export default function SettingsForm({
  initialFullName,
  email,
}: SettingsFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState('')

  const dirty = fullName.trim() !== initialFullName.trim()

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) {
      setError('Session expired. Please log in again.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', authUser.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSavedAt(Date.now())
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full-name">Full name</Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-[12px] text-text-3">
          Email changes go through{' '}
          <a
            href="mailto:support@getpupil.com"
            className="text-primary hover:underline"
          >
            support
          </a>
          .
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            'Save changes'
          )}
        </Button>
        {savedAt && !dirty && !saving && (
          <span className="text-[12px] text-success">Saved</span>
        )}
      </div>
    </div>
  )
}
