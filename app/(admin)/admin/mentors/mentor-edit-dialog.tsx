'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader as Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { MENTOR_SPECIALTIES } from '@/lib/constants'
import { updateMentorProfile } from '@/lib/actions/mentor-admin-actions'

import type { MentorReviewItem } from './types'

const YEARS_IN_SCHOOL = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
] as const

const STATUS_OPTIONS: { value: MentorReviewItem['status']; label: string }[] = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'paused', label: 'Paused' },
  { value: 'rejected', label: 'Rejected' },
]

export default function MentorEditDialog({
  mentor,
  open,
  onOpenChange,
}: {
  mentor: MentorReviewItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState(mentor.full_name ?? '')
  const [university, setUniversity] = useState(mentor.university ?? '')
  const [major, setMajor] = useState(mentor.major ?? '')
  const [gradYear, setGradYear] = useState(
    mentor.grad_year != null ? String(mentor.grad_year) : ''
  )
  const [yearInSchool, setYearInSchool] = useState(mentor.year_in_school ?? '')
  const [bio, setBio] = useState(mentor.bio ?? '')
  const [linkedin, setLinkedin] = useState(mentor.linkedin_url ?? '')
  const [maxMentees, setMaxMentees] = useState(String(mentor.max_mentees ?? 0))
  const [status, setStatus] = useState<MentorReviewItem['status']>(
    mentor.status
  )
  const [tags, setTags] = useState<string[]>(mentor.tags ?? [])

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      const result = await updateMentorProfile({
        mentorUserId: mentor.user_id,
        fullName,
        university,
        major,
        gradYear,
        yearInSchool,
        bio,
        linkedinInput: linkedin,
        tags,
        maxMentees: Number.parseInt(maxMentees, 10) || 0,
        status,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Edit mentor profile</DialogTitle>
          <DialogDescription>
            Update {mentor.full_name || mentor.email}&rsquo;s details. Changes go
            live on the directory immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-full-name">Full name</Label>
            <Input
              id="edit-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-university">University</Label>
              <Input
                id="edit-university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Georgetown University"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-major">Major</Label>
              <Input
                id="edit-major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-year-in-school">Year in school</Label>
              <NativeSelect
                id="edit-year-in-school"
                value={yearInSchool}
                onChange={(e) => setYearInSchool(e.target.value)}
              >
                <NativeSelectOption value="">Not set</NativeSelectOption>
                {YEARS_IN_SCHOOL.map((y) => (
                  <NativeSelectOption key={y} value={y}>
                    {y}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-grad-year">Graduation year</Label>
              <Input
                id="edit-grad-year"
                type="number"
                inputMode="numeric"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                placeholder="2027"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="A short intro shown on the mentor's public profile."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
            <Input
              id="edit-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="linkedin.com/in/username"
            />
          </div>

          <div className="space-y-2">
            <Label>Specialty tags</Label>
            <div className="flex flex-wrap gap-2">
              {MENTOR_SPECIALTIES.map((specialty) => {
                const selected = tags.includes(specialty)
                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleTag(specialty)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      selected
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-border-strong bg-surface text-text-2 hover:bg-surface-2'
                    }`}
                  >
                    {specialty}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-max-mentees">Max mentees</Label>
              <Input
                id="edit-max-mentees"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={maxMentees}
                onChange={(e) => setMaxMentees(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Approval status</Label>
              <NativeSelect
                id="edit-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as MentorReviewItem['status'])
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {error && <p className="text-[12px] text-[#B91C1C]">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
