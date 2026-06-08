'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BrandMark from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, CheckCircle, Loader as Loader2 } from 'lucide-react'

import {
  backgroundDimensions,
  fitDimensions,
  sensitiveDimensions,
  getDimension,
  type Dimension,
} from '@/lib/identity-taxonomy'
import {
  DimensionField,
  type Role,
} from '@/components/onboarding/identity-fields'
import {
  emptyIdentityState,
  serializeIdentity,
  type IdentityState,
} from '@/lib/onboarding-identity'

const ROLE: Role = 'mentee'

const INTERESTS = [
  'Computer Science', 'Biology', 'Engineering', 'Business', 'Psychology',
  'Political Science', 'Economics', 'Nursing', 'Education', 'Communications',
  'Art & Design', 'Environmental Science', 'Pre-Med', 'Pre-Law', 'Music',
  'Film', 'Journalism', 'Mathematics', 'Physics', 'Chemistry',
  'Sociology', 'History', 'Philosophy', 'Neuroscience', 'Public Health',
]

const CAREERS = [
  'Software Engineer', 'Doctor / Physician', 'Lawyer', 'Entrepreneur',
  'Researcher', 'Teacher', 'Nurse', 'Investment Banker', 'Product Designer',
  'Data Scientist', 'Journalist', 'Social Worker', 'Consultant', 'Architect',
]

const COLLEGES = [
  'Harvard', 'Stanford', 'MIT', 'Yale', 'Princeton', 'Columbia', 'Penn',
  'Brown', 'Cornell', 'Dartmouth', 'Duke', 'Georgetown', 'NYU', 'UCLA',
  'UC Berkeley', 'Michigan', 'UVA', 'Northwestern', 'USC', 'Emory',
  'Tufts', 'Boston College', 'Vanderbilt', 'Rice', 'Notre Dame',
]

const GPA_DIMENSION = getDimension('gpa_range')!

function TagPicker({ options, selected, onToggle, placeholder }: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  placeholder?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = options.filter(o => !selected.includes(o) && o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {selected.map(s => (
          <span
            key={s}
            onClick={() => onToggle(s)}
            className="inline-flex cursor-pointer items-center rounded-full bg-[#7A60E4]/10 px-3 py-1 text-sm font-medium text-[#7A60E4] hover:bg-[#7A60E4]/20"
          >
            {s} &times;
          </span>
        ))}
      </div>
      <Input
        placeholder={placeholder || 'Search...'}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {search && filtered.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filtered.slice(0, 8).map(o => (
            <span
              key={o}
              onClick={() => { onToggle(o); setSearch('') }}
              className="inline-flex cursor-pointer items-center rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-[#7A60E4] hover:text-[#7A60E4]"
            >
              + {o}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalSteps = 7

  const [grade, setGrade] = useState('')
  const [gpa, setGpa] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const [interests, setInterests] = useState<string[]>([])
  const [careers, setCareers] = useState<string[]>([])
  const [colleges, setColleges] = useState<string[]>([])

  // Canonical taxonomy answers (background + fit prefs + sensitive).
  const [identity, setIdentity] = useState<IdentityState>(emptyIdentityState())

  const [bio, setBio] = useState('')

  const toggleIn = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const valueFor = (dim: Dimension): string[] | string =>
    identity.answers[dim.dimension_key] ?? (dim.select === 'multi' ? [] : '')

  const setAnswer = (key: string, next: string[] | string) =>
    setIdentity((s) => ({ ...s, answers: { ...s.answers, [key]: next } }))

  const setSelfText = (key: string, v: string) =>
    setIdentity((s) => ({ ...s, selfText: { ...s.selfText, [key]: v } }))

  const renderDim = (dim: Dimension) => (
    <DimensionField
      key={dim.dimension_key}
      dim={dim}
      role={ROLE}
      value={valueFor(dim)}
      onChange={(next) => setAnswer(dim.dimension_key, next)}
      selfDescribeText={identity.selfText[dim.dimension_key] ?? ''}
      onSelfDescribeTextChange={(v) => setSelfText(dim.dimension_key, v)}
    />
  )

  const canContinueStep1 = gpa.length > 0

  const handleSubmit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { identityJson, promoted, fitPreferences } = serializeIdentity(
      ROLE,
      identity
    )

    await supabase.from('student_profiles').upsert({
      user_id: user.id,
      grade: parseInt(grade) || null,
      gpa,
      city,
      state,
      interests,
      colleges,
      careers,
      bio: bio.trim() || null,
      identity_json: identityJson,
      // Pair PREFERENCE side + college target list -> fit_preferences.
      fit_preferences: { ...fitPreferences, college_list: colleges },
      // Promoted matching columns (mentee mirror dims). Pair columns stay
      // empty for mentees — their pair answers are preferences, not attributes.
      race_ethnicity: promoted.race_ethnicity ?? [],
      academic_identity: promoted.academic_identity ?? [],
      first_gen: promoted.first_gen ?? [],
    })

    await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id)

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <BrandMark size="sm" />
        <span className="text-sm text-gray-400">Step {step} of {totalSteps}</span>
      </div>

      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-[#7A60E4] transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
        {step === 1 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">About you</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Let&apos;s start with the basics.</h1>
            <p className="mt-2 text-gray-500">This helps us match you with mentors who&apos;ve been where you are.</p>
            <div className="mt-8 space-y-5">
              <div>
                <Label>Grade level <span className="font-normal text-gray-400">(optional)</span></Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="">Select grade</option>
                  <option value="9">9th</option>
                  <option value="10">10th</option>
                  <option value="11">11th</option>
                  <option value="12">12th</option>
                </select>
              </div>
              <div>
                <Label>GPA range <span className="font-medium text-[#7A60E4]">(required)</span></Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={gpa} onChange={e => setGpa(e.target.value)}>
                  <option value="" disabled>Select GPA range</option>
                  {GPA_DIMENSION.options.map((o) => (
                    <option key={o.code} value={o.code}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City <span className="font-normal text-gray-400">(optional)</span></Label>
                  <Input className="mt-1" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>State <span className="font-normal text-gray-400">(optional)</span></Label>
                  <Input className="mt-1" value={state} onChange={e => setState(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">Interests</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">What are you into?</h1>
            <p className="mt-2 text-gray-500">Pick the academic areas and careers that interest you.</p>
            <div className="mt-8 space-y-6">
              <div>
                <Label>Academic interests</Label>
                <div className="mt-2">
                  <TagPicker options={INTERESTS} selected={interests} onToggle={v => toggleIn(interests, setInterests, v)} placeholder="Search interests..." />
                </div>
              </div>
              <div>
                <Label>Career interests</Label>
                <div className="mt-2">
                  <TagPicker options={CAREERS} selected={careers} onToggle={v => toggleIn(careers, setCareers, v)} placeholder="Search careers..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">College preferences</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Where do you want to go?</h1>
            <p className="mt-2 text-gray-500">Add schools you&apos;re interested in. We&apos;ll prioritize mentors who attend or attended these schools.</p>
            <div className="mt-8">
              <Label>Dream schools <span className="font-normal text-gray-400">(optional)</span></Label>
              <div className="mt-2">
                <TagPicker options={COLLEGES} selected={colleges} onToggle={v => toggleIn(colleges, setColleges, v)} placeholder="Search colleges..." />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">What you&apos;re looking for</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">What do you want in a mentor?</h1>
            <p className="mt-2 text-gray-500">All optional. Tell us the experiences and paths you&apos;d like your mentor to have, and we&apos;ll prioritize matches.</p>
            <div className="mt-8 space-y-8">
              {fitDimensions.map(renderDim)}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">Your background</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Tell us about yourself.</h1>
            <p className="mt-2 text-gray-500">Everything here is optional. It helps us match you with mentors who&apos;ve shared your experiences.</p>
            <div className="mt-8 space-y-8">
              {backgroundDimensions.map(renderDim)}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">Identity</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">A few sensitive questions.</h1>
            <p className="mt-2 text-gray-500">
              Optional — used only for matching, never shown publicly. You can skip this whole section.
            </p>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
              <input
                type="checkbox"
                checked={identity.consent}
                onChange={(e) =>
                  setIdentity((s) => ({ ...s, consent: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#7A60E4]"
              />
              <span className="text-sm text-gray-700">
                I&apos;m okay sharing this for matching. It stays private and is
                never shown on my profile or to mentors directly.
              </span>
            </label>

            {identity.consent && (
              <div className="mt-8 space-y-8">
                {sensitiveDimensions.map(renderDim)}
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">About you</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Introduce yourself to mentors.</h1>
            <p className="mt-2 text-gray-500">
              Short intro mentors will see when you request to be matched with them. A couple of sentences works. You can edit this later.
            </p>
            <div className="mt-6 space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 250))}
                rows={5}
                placeholder="I'm a junior at Lincoln High thinking about pre-med, but I'm not sure if a small liberal arts school or a big research university is the right fit. Want to figure out how to make my application stand out."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#7A60E4] focus:outline-none"
              />
              <p className="text-xs text-gray-400">
                {bio.length} / 250 characters. Optional, but mentors are more likely to accept requests with context.
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : <span />}

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !canContinueStep1}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" /> Complete setup</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
