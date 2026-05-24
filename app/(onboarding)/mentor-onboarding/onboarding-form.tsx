'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Loader as Loader2,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import BrandMark from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CollegeRecord, MajorRecord } from '@/lib/data/colleges-majors'
import { MENTOR_SPECIALTIES } from '@/lib/constants'

const TOTAL_STEPS = 5

const YEARS_IN_SCHOOL = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
] as const

const SPECIALTIES = MENTOR_SPECIALTIES

const TIME_WINDOWS = [
  { id: 'weekday_morning', label: 'Weekday mornings', sub: '9am - 12pm' },
  { id: 'weekday_afternoon', label: 'Weekday afternoons', sub: '12pm - 4pm' },
  { id: 'weekday_evening', label: 'Weekday evenings', sub: '4pm - 8pm' },
  { id: 'weekend_morning', label: 'Weekend mornings', sub: '9am - 12pm' },
  { id: 'weekend_afternoon', label: 'Weekend afternoons', sub: '12pm - 4pm' },
  { id: 'weekend_evening', label: 'Weekend evenings', sub: '4pm - 8pm' },
] as const

const COMMITMENT_OPTIONS = [
  { value: 'semester', label: 'One semester' },
  { value: 'year', label: 'Full academic year' },
  { value: 'open', label: 'Open-ended' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'Europe/London',
]

const MOTIVATIONS = [
  'Make a positive impact on younger students',
  'Give back to my community',
  'Develop leadership and communication skills',
  'Help my career or resume',
  'Care about educational equity',
  'Build connections with like-minded peers',
  'Interested in education / advising as a career',
  'Want to be paid or provided a stipend (future)',
]

const ETHNICITIES = [
  'American Indian or Alaska Native',
  'Asian or Asian American',
  'Black or African American',
  'Hispanic or Latino/a/x',
  'Middle Eastern or North African',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Prefer to self-describe',
]

const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Non-binary',
  'Prefer to self-describe',
  'Prefer not to say',
]

const FIRST_GEN_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unspecified', label: 'Prefer not to say' },
]

const MENTEE_PREFERENCES = [
  'First-generation students',
  'Students from low-income backgrounds',
  'Students of color',
  'LGBTQ+ students',
  'Students from rural areas',
  'International students',
  'Open to mentoring all students',
]

const BIO_MAX = 280

export type ExistingProfile = {
  university: string | null
  major: string | null
  college_id: string | null
  major_id: string | null
  grad_year: number | null
  year_in_school: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  tags: string[] | null
  timezone: string | null
  availability_schedule: { time_windows?: string[] } | null
  max_mentees: number | null
  commitment: string | null
  motivations: string[] | null
  identity_json: {
    gender?: string
    ethnicities?: string[]
    first_gen?: string
    mentee_preferences?: string[]
  } | null
  status: string | null
  submitted_at: string | null
}

function normalizeLinkedinUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^linkedin\.com/i.test(trimmed)) return `https://${trimmed}`
  if (/^www\.linkedin\.com/i.test(trimmed)) return `https://${trimmed.replace(/^www\./i, '')}`
  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, '')}`
}

interface MentorOnboardingFormProps {
  userId: string
  fullName: string
  email: string
  existingProfile: ExistingProfile | null
  colleges: CollegeRecord[]
  majors: MajorRecord[]
}

export default function MentorOnboardingForm({
  userId,
  fullName: initialFullName,
  email,
  existingProfile,
  colleges,
  majors,
}: MentorOnboardingFormProps) {
  const collegeOptions = useMemo<ComboboxOption[]>(
    () =>
      colleges.map((c) => ({
        value: c.id,
        label: c.name,
        description: c.state,
        keywords: c.state,
      })),
    [colleges]
  )

  const majorOptions = useMemo<ComboboxOption[]>(
    () => majors.map((m) => ({ value: m.id, label: m.name })),
    [majors]
  )

  const collegeById = useMemo(
    () => new Map(colleges.map((c) => [c.id, c])),
    [colleges]
  )
  const majorById = useMemo(
    () => new Map(majors.map((m) => [m.id, m])),
    [majors]
  )
  const collegeIdByName = useMemo(
    () => new Map(colleges.map((c) => [c.name.toLowerCase(), c.id])),
    [colleges]
  )
  const majorIdByName = useMemo(
    () => new Map(majors.map((m) => [m.name.toLowerCase(), m.id])),
    [majors]
  )
  const router = useRouter()
  const browserTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'America/New_York'
    }
  }, [])

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState(initialFullName)
  const [collegeId, setCollegeId] = useState(() => {
    if (existingProfile?.college_id) return existingProfile.college_id
    if (existingProfile?.university) {
      return collegeIdByName.get(existingProfile.university.toLowerCase()) ?? ''
    }
    return ''
  })
  const [yearInSchool, setYearInSchool] = useState(
    existingProfile?.year_in_school ?? ''
  )
  const [majorId, setMajorId] = useState(() => {
    if (existingProfile?.major_id) return existingProfile.major_id
    if (existingProfile?.major) {
      return majorIdByName.get(existingProfile.major.toLowerCase()) ?? ''
    }
    return ''
  })
  const [gradYear, setGradYear] = useState(
    existingProfile?.grad_year ? String(existingProfile.grad_year) : ''
  )

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingProfile?.photo_url ?? null
  )
  const [bio, setBio] = useState(existingProfile?.bio ?? '')
  const [linkedin, setLinkedin] = useState(
    existingProfile?.linkedin_url ?? ''
  )
  const [tags, setTags] = useState<string[]>(existingProfile?.tags ?? [])

  const [gender, setGender] = useState(
    existingProfile?.identity_json?.gender ?? ''
  )
  const [ethnicities, setEthnicities] = useState<string[]>(
    existingProfile?.identity_json?.ethnicities ?? []
  )
  const [firstGen, setFirstGen] = useState(
    existingProfile?.identity_json?.first_gen ?? ''
  )
  const [menteePreferences, setMenteePreferences] = useState<string[]>(
    existingProfile?.identity_json?.mentee_preferences ?? []
  )

  const [timezone, setTimezone] = useState(
    existingProfile?.timezone ?? browserTz
  )
  const [timeWindows, setTimeWindows] = useState<string[]>(
    existingProfile?.availability_schedule?.time_windows ?? []
  )
  const [maxMentees, setMaxMentees] = useState(
    existingProfile?.max_mentees ?? 3
  )
  const [commitment, setCommitment] = useState(
    existingProfile?.commitment ?? ''
  )
  const [motivations, setMotivations] = useState<string[]>(
    existingProfile?.motivations ?? []
  )

  const [ackMinors, setAckMinors] = useState(false)
  const [ackRecording, setAckRecording] = useState(false)
  const [ackContact, setAckContact] = useState(false)
  const [ackBackground, setAckBackground] = useState(false)
  const [ackTerms, setAckTerms] = useState(false)

  const allAcksChecked =
    ackMinors && ackRecording && ackContact && ackBackground && ackTerms

  const toggle = (
    arr: string[],
    set: (v: string[]) => void,
    val: string
  ) => {
    if (arr.includes(val)) {
      set(arr.filter((x) => x !== val))
    } else {
      set([...arr, val])
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.')
      return
    }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const canContinueStep1 =
    fullName.trim().length > 0 &&
    collegeId.length > 0 &&
    yearInSchool.length > 0 &&
    majorId.length > 0 &&
    gradYear.length === 4

  const canContinueStep2 =
    (photoPreview || photoFile) &&
    bio.trim().length >= 30 &&
    tags.length >= 1

  const canContinueStep3 = true

  const canContinueStep4 =
    timezone.length > 0 && timeWindows.length >= 1 && commitment.length > 0

  const canSubmit = allAcksChecked && !submitting

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      const supabase = createClient()

      let uploadedPhotoUrl = existingProfile?.photo_url ?? null

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${userId}/photo-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('mentor-photos')
          .upload(path, photoFile, { upsert: true })

        if (uploadError) {
          setError(`Photo upload failed: ${uploadError.message}`)
          setSubmitting(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('mentor-photos')
          .getPublicUrl(path)

        uploadedPhotoUrl = publicUrlData.publicUrl
      }

      if (fullName.trim() !== initialFullName) {
        await supabase
          .from('users')
          .update({ full_name: fullName.trim() })
          .eq('id', userId)
      }

      const collegeRecord = collegeById.get(collegeId)
      const majorRecord = majorById.get(majorId)

      if (!collegeRecord || !majorRecord) {
        setError('Please select a valid college and major.')
        setSubmitting(false)
        return
      }

      const { error: profileError } = await supabase
        .from('mentor_profiles')
        .upsert(
          {
            user_id: userId,
            university: collegeRecord.name,
            college_id: collegeRecord.id,
            major: majorRecord.name,
            major_id: majorRecord.id,
            grad_year: parseInt(gradYear, 10),
            year_in_school: yearInSchool,
            bio: bio.trim(),
            photo_url: uploadedPhotoUrl,
            linkedin_url: normalizeLinkedinUrl(linkedin),
            tags,
            timezone,
            availability_schedule: { time_windows: timeWindows },
            max_mentees: maxMentees,
            commitment,
            motivations,
            identity_json: {
              gender: gender || undefined,
              ethnicities: ethnicities.length > 0 ? ethnicities : undefined,
              first_gen: firstGen || undefined,
              mentee_preferences:
                menteePreferences.length > 0 ? menteePreferences : undefined,
            },
            safety_acks: {
              minors: { accepted: true, at: new Date().toISOString() },
              recording: { accepted: true, at: new Date().toISOString() },
              contact_off_platform: {
                accepted: true,
                at: new Date().toISOString(),
              },
              background_check_consent: {
                accepted: true,
                at: new Date().toISOString(),
              },
              terms: { accepted: true, at: new Date().toISOString() },
            },
            status: 'pending',
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (profileError) {
        setError(profileError.message)
        setSubmitting(false)
        return
      }

      await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', userId)

      router.push('/mentor')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <BrandMark size="sm" />
        <span className="text-[13px] text-text-3">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      <div className="h-1 bg-surface-2">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        {error && (
          <div className="mb-6 rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[13px] text-[#B91C1C]">
            {error}
          </div>
        )}

        {step === 1 && (
          <Step1Academic
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            collegeId={collegeId}
            setCollegeId={setCollegeId}
            collegeOptions={collegeOptions}
            yearInSchool={yearInSchool}
            setYearInSchool={setYearInSchool}
            majorId={majorId}
            setMajorId={setMajorId}
            majorOptions={majorOptions}
            gradYear={gradYear}
            setGradYear={setGradYear}
          />
        )}

        {step === 2 && (
          <Step2PublicProfile
            photoPreview={photoPreview}
            handlePhotoChange={handlePhotoChange}
            bio={bio}
            setBio={setBio}
            linkedin={linkedin}
            setLinkedin={setLinkedin}
            tags={tags}
            toggleTag={(t) => toggle(tags, setTags, t)}
          />
        )}

        {step === 3 && (
          <Step3Identity
            gender={gender}
            setGender={setGender}
            ethnicities={ethnicities}
            toggleEthnicity={(e) => toggle(ethnicities, setEthnicities, e)}
            firstGen={firstGen}
            setFirstGen={setFirstGen}
            menteePreferences={menteePreferences}
            toggleMenteePref={(p) =>
              toggle(menteePreferences, setMenteePreferences, p)
            }
          />
        )}

        {step === 4 && (
          <Step4Availability
            timezone={timezone}
            setTimezone={setTimezone}
            timeWindows={timeWindows}
            toggleTimeWindow={(w) => toggle(timeWindows, setTimeWindows, w)}
            maxMentees={maxMentees}
            setMaxMentees={setMaxMentees}
            commitment={commitment}
            setCommitment={setCommitment}
            motivations={motivations}
            toggleMotivation={(m) => toggle(motivations, setMotivations, m)}
          />
        )}

        {step === 5 && (
          <Step5Safety
            ackMinors={ackMinors}
            setAckMinors={setAckMinors}
            ackRecording={ackRecording}
            setAckRecording={setAckRecording}
            ackContact={ackContact}
            setAckContact={setAckContact}
            ackBackground={ackBackground}
            setAckBackground={setAckBackground}
            ackTerms={ackTerms}
            setAckTerms={setAckTerms}
          />
        )}

        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={goBack} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Link
              href="/login"
              className="text-[13px] text-text-3 hover:text-text-2"
            >
              Save and finish later
            </Link>
          )}

          {step < TOTAL_STEPS && (
            <Button
              onClick={goNext}
              disabled={
                (step === 1 && !canContinueStep1) ||
                (step === 2 && !canContinueStep2) ||
                (step === 3 && !canContinueStep3) ||
                (step === 4 && !canContinueStep4)
              }
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {step === TOTAL_STEPS && (
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit application'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-8">
      <p className="tiny mb-2">{eyebrow}</p>
      <h1 className="display text-[28px] leading-tight">{title}</h1>
      <p className="mt-2 text-[14px] text-text-2">{description}</p>
    </div>
  )
}

function Chip({
  label,
  selected,
  onClick,
  sub,
}: {
  label: string
  selected: boolean
  onClick: () => void
  sub?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-[var(--radius-sm)] border px-3 py-2 text-left text-[13px] font-medium transition-all',
        selected
          ? 'border-primary bg-primary-light text-primary'
          : 'border-border-strong bg-surface text-text hover:border-primary'
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        {label}
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
      {sub && <span className="text-[11px] text-text-3">{sub}</span>}
    </button>
  )
}

function Step1Academic({
  fullName,
  setFullName,
  email,
  collegeId,
  setCollegeId,
  collegeOptions,
  yearInSchool,
  setYearInSchool,
  majorId,
  setMajorId,
  majorOptions,
  gradYear,
  setGradYear,
}: {
  fullName: string
  setFullName: (v: string) => void
  email: string
  collegeId: string
  setCollegeId: (v: string) => void
  collegeOptions: ComboboxOption[]
  yearInSchool: string
  setYearInSchool: (v: string) => void
  majorId: string
  setMajorId: (v: string) => void
  majorOptions: ComboboxOption[]
  gradYear: string
  setGradYear: (v: string) => void
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Academic profile"
        title="Tell us about your school."
        description="This is what students will see when they're looking for a mentor like you."
      />

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
          <p className="text-[12px] text-text-3">
            To change your email, contact{' '}
            <a
              href="mailto:support@getpupil.com"
              className="text-primary hover:underline"
            >
              support
            </a>
            .
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">College or university</Label>
          <Combobox
            id="university"
            options={collegeOptions}
            value={collegeId}
            onValueChange={setCollegeId}
            placeholder="Search for your school..."
            searchPlaceholder="Search 1,000+ colleges..."
            emptyMessage="No colleges match. Try a different name."
          />
          <p className="text-[12px] text-text-3">
            Don&apos;t see your school?{' '}
            <a
              href="mailto:support@getpupil.com?subject=Add my school"
              className="text-primary hover:underline"
            >
              Let us know
            </a>{' '}
            and we&apos;ll add it.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={yearInSchool} onValueChange={setYearInSchool}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS_IN_SCHOOL.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grad-year">Graduation year</Label>
            <Input
              id="grad-year"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="2027"
              value={gradYear}
              onChange={(e) =>
                setGradYear(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Major or area of study</Label>
          <Combobox
            id="major"
            options={majorOptions}
            value={majorId}
            onValueChange={setMajorId}
            placeholder="Search for your major..."
            searchPlaceholder="Search top 120 majors..."
            emptyMessage="No majors match. Try a different keyword."
            maxRendered={50}
          />
          <p className="text-[12px] text-text-3">
            Most common majors are at the top. Type to search the full list.
          </p>
        </div>
      </div>
    </div>
  )
}

function Step2PublicProfile({
  photoPreview,
  handlePhotoChange,
  bio,
  setBio,
  linkedin,
  setLinkedin,
  tags,
  toggleTag,
}: {
  photoPreview: string | null
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  bio: string
  setBio: (v: string) => void
  linkedin: string
  setLinkedin: (v: string) => void
  tags: string[]
  toggleTag: (t: string) => void
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Public profile"
        title="Show students who you are."
        description="A photo and a real bio go a long way. Students see this when picking a mentor."
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Profile photo</Label>
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-border bg-surface-2">
              {photoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-7 w-7 text-text-3" />
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2 text-[13px] font-medium text-text transition-colors hover:border-primary">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </label>
              <p className="mt-2 text-[12px] text-text-3">
                JPEG, PNG, or WebP. Up to 5 MB.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Short bio</Label>
            <span
              className={cn(
                'text-[12px]',
                bio.length > BIO_MAX ? 'text-[#B91C1C]' : 'text-text-3'
              )}
            >
              {bio.length} / {BIO_MAX}
            </span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A couple sentences about your story, what you study, and what you'd want a high schooler to know."
            rows={4}
            maxLength={BIO_MAX}
            className="w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2 text-[14px] text-text transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--primary-light)]"
          />
          <p className="text-[12px] text-text-3">
            Minimum 30 characters. Avoid contact info, that goes against
            platform safety rules.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            type="text"
            placeholder="linkedin.com/in/your-handle"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
          <p className="text-[12px] text-text-3">
            Optional, but recommended. Helps us verify your background and
            shows up on your public profile if you want it to.
          </p>
        </div>

        <div className="space-y-2">
          <Label>What are you best at helping with?</Label>
          <p className="text-[12px] text-text-3">
            Pick at least one. These are the topics students will filter by.
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={tags.includes(s)}
                onClick={() => toggleTag(s)}
              />
            ))}
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="purple">
                  {t}
                  <button
                    type="button"
                    onClick={() => toggleTag(t)}
                    className="ml-1 inline-flex"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Step3Identity({
  gender,
  setGender,
  ethnicities,
  toggleEthnicity,
  firstGen,
  setFirstGen,
  menteePreferences,
  toggleMenteePref,
}: {
  gender: string
  setGender: (v: string) => void
  ethnicities: string[]
  toggleEthnicity: (e: string) => void
  firstGen: string
  setFirstGen: (v: string) => void
  menteePreferences: string[]
  toggleMenteePref: (p: string) => void
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Identity"
        title="Help us match you with the right students."
        description="Everything on this step is optional. We use it to make better matches when students request mentors who share their background."
      />

      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender identity</Label>
          <Select
            value={gender || '__none__'}
            onValueChange={(v) => setGender(v === '__none__' ? '' : v)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Prefer not to say" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Prefer not to say</SelectItem>
              {GENDER_OPTIONS.filter((g) => g !== 'Prefer not to say').map(
                (g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Race / ethnicity</Label>
          <p className="text-[12px] text-text-3">
            Select all that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {ETHNICITIES.map((e) => (
              <Chip
                key={e}
                label={e}
                selected={ethnicities.includes(e)}
                onClick={() => toggleEthnicity(e)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>First-generation college student</Label>
          <p className="text-[12px] text-text-3">
            Your parents didn&apos;t complete a 4-year college degree.
          </p>
          <div className="flex flex-wrap gap-2">
            {FIRST_GEN_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={firstGen === o.value}
                onClick={() => setFirstGen(o.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Students you&apos;d especially like to support</Label>
          <p className="text-[12px] text-text-3">
            We use this to weight matching, not as a hard filter. Optional.
          </p>
          <div className="flex flex-wrap gap-2">
            {MENTEE_PREFERENCES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={menteePreferences.includes(p)}
                onClick={() => toggleMenteePref(p)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4Availability({
  timezone,
  setTimezone,
  timeWindows,
  toggleTimeWindow,
  maxMentees,
  setMaxMentees,
  commitment,
  setCommitment,
  motivations,
  toggleMotivation,
}: {
  timezone: string
  setTimezone: (v: string) => void
  timeWindows: string[]
  toggleTimeWindow: (w: string) => void
  maxMentees: number
  setMaxMentees: (v: number) => void
  commitment: string
  setCommitment: (v: string) => void
  motivations: string[]
  toggleMotivation: (m: string) => void
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Availability"
        title="When can you mentor?"
        description="Pick the time windows that consistently work for you. Sessions are 30 minutes."
      />

      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="timezone">Your timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              {!TIMEZONES.includes(timezone) && timezone && (
                <SelectItem value={timezone}>
                  {timezone.replace(/_/g, ' ')} (browser detected)
                </SelectItem>
              )}
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time windows you&apos;re available for</Label>
          <p className="text-[12px] text-text-3">
            Pick at least one. You can adjust later.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TIME_WINDOWS.map((w) => (
              <Chip
                key={w.id}
                label={w.label}
                sub={w.sub}
                selected={timeWindows.includes(w.id)}
                onClick={() => toggleTimeWindow(w.id)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-mentees">
            How many mentees do you want to take on?
          </Label>
          <p className="text-[12px] text-text-3">
            Most mentors start with 2-3. You can change this later.
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip
                key={n}
                label={`${n} ${n === 1 ? 'mentee' : 'mentees'}`}
                selected={maxMentees === n}
                onClick={() => setMaxMentees(n)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>How long are you planning to mentor?</Label>
          <div className="flex flex-wrap gap-2">
            {COMMITMENT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={commitment === o.value}
                onClick={() => setCommitment(o.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>What&apos;s motivating you to mentor?</Label>
          <p className="text-[12px] text-text-3">
            Optional. Pick all that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVATIONS.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={motivations.includes(m)}
                onClick={() => toggleMotivation(m)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step5Safety({
  ackMinors,
  setAckMinors,
  ackRecording,
  setAckRecording,
  ackContact,
  setAckContact,
  ackBackground,
  setAckBackground,
  ackTerms,
  setAckTerms,
}: {
  ackMinors: boolean
  setAckMinors: (v: boolean) => void
  ackRecording: boolean
  setAckRecording: (v: boolean) => void
  ackContact: boolean
  setAckContact: (v: boolean) => void
  ackBackground: boolean
  setAckBackground: (v: boolean) => void
  ackTerms: boolean
  setAckTerms: (v: boolean) => void
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Safety"
        title="A few important agreements."
        description="Pupil mentors work with high school students. These aren't fine print, please read each one."
      />

      <div className="space-y-3">
        <SafetyCheck
          checked={ackMinors}
          onChange={setAckMinors}
          title="I'll be mentoring minors"
          body="I understand I'll be paired with high school students under 18 and will conduct myself professionally at all times."
        />
        <SafetyCheck
          checked={ackRecording}
          onChange={setAckRecording}
          title="Sessions are recorded"
          body="All video sessions are recorded and transcribed for safety review. I consent to this."
        />
        <SafetyCheck
          checked={ackContact}
          onChange={setAckContact}
          title="No off-platform contact"
          body="I won't ask for or share personal contact info (phone, email, social media) with my mentees. All communication happens on Pupil."
        />
        <SafetyCheck
          checked={ackBackground}
          onChange={setAckBackground}
          title="Background check consent"
          body="I consent to a basic background check if Pupil requests one. (Not required to start, but reserved for future safety review.)"
        />
        <SafetyCheck
          checked={ackTerms}
          onChange={setAckTerms}
          title="Terms and code of conduct"
          body={
            <>
              I&apos;ve read and agree to the{' '}
              <Link
                href="/legal/terms"
                target="_blank"
                className="text-primary hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </>
          }
        />
      </div>
    </div>
  )
}

function SafetyCheck({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  body: React.ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border bg-surface p-4 transition-all',
        checked
          ? 'border-primary bg-primary-light/40'
          : 'border-border hover:border-border-strong'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-[color:var(--primary)]"
      />
      <div className="flex-1 space-y-1">
        <p className="text-[14px] font-semibold text-text">{title}</p>
        <p className="text-[13px] leading-relaxed text-text-2">{body}</p>
      </div>
    </label>
  )
}
