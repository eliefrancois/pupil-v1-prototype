'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BrandMark from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, CheckCircle, Loader as Loader2 } from 'lucide-react'


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
  const totalSteps = 5

  const [grade, setGrade] = useState('')
  const [gpa, setGpa] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const [interests, setInterests] = useState<string[]>([])
  const [careers, setCareers] = useState<string[]>([])
  const [colleges, setColleges] = useState<string[]>([])

  const [ethnicity, setEthnicity] = useState('')
  const [firstGen, setFirstGen] = useState('')

  const [bio, setBio] = useState('')

  const toggleIn = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const canContinueStep1 = gpa.length > 0

  const handleSubmit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

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
      identity_json: { ethnicity, first_gen: firstGen === 'yes' },
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
                <Label>Grade level</Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="">Select grade</option>
                  <option value="9">9th</option>
                  <option value="10">10th</option>
                  <option value="11">11th</option>
                  <option value="12">12th</option>
                </select>
              </div>
              <div>
                <Label>GPA range</Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={gpa} onChange={e => setGpa(e.target.value)}>
                  <option value="" disabled>Select GPA range</option>
                  <option>4.0+</option>
                  <option>3.7-3.9</option>
                  <option>3.4-3.6</option>
                  <option>3.0-3.3</option>
                  <option>Below 3.0</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input className="mt-1" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
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
            <p className="mt-2 text-gray-500">Add schools you&apos;re interested in. We&apos;ll match you with mentors from these programs.</p>
            <div className="mt-8">
              <Label>Dream schools</Label>
              <div className="mt-2">
                <TagPicker options={COLLEGES} selected={colleges} onToggle={v => toggleIn(colleges, setColleges, v)} placeholder="Search colleges..." />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">Identity matching</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Help us find the right mentor.</h1>
            <p className="mt-2 text-gray-500">Optional. This helps us match you with mentors who share your background.</p>
            <div className="mt-8 space-y-5">
              <div>
                <Label>Ethnic background <span className="font-normal text-gray-400">(optional)</span></Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={ethnicity} onChange={e => setEthnicity(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option>Asian American</option>
                  <option>Black / African American</option>
                  <option>Hispanic / Latino</option>
                  <option>Native American</option>
                  <option>White / Caucasian</option>
                  <option>Middle Eastern / North African</option>
                  <option>Pacific Islander</option>
                  <option>Multiracial</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Are you a first-generation college student?</Label>
                <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={firstGen} onChange={e => setFirstGen(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">First-gen means neither parent has a 4-year college degree.</p>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
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
