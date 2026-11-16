"use client"

import { useState } from "react"
import { Check, Loader as Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import EmailHint from "@/components/email-hint"
import { isValidEmail } from "@/lib/validation/email"
import {
  ELIGIBILITY_CONSENT_TEXT,
  ELIGIBILITY_TYPES,
  type EligibilityType,
} from "@/lib/eligibility"

import { submitEligibilityApplication } from "./actions"

type SubmitResult = { emailSent: boolean } | null

export default function AccessPage() {
  const [studentName, setStudentName] = useState("")
  const [parentName, setParentName] = useState("")
  const [email, setEmail] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [grade, setGrade] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [eligibilityType, setEligibilityType] = useState<EligibilityType | null>(null)
  const [counselorEmail, setCounselorEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")

  const [emailTouched, setEmailTouched] = useState(false)
  const [studentEmailTouched, setStudentEmailTouched] = useState(false)
  const [counselorEmailTouched, setCounselorEmailTouched] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<SubmitResult>(null)

  const handleEligibilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const studentEmailValid = !studentEmail.trim() || isValidEmail(studentEmail)
    if (!isValidEmail(email) || !studentEmailValid || !isValidEmail(counselorEmail)) {
      setEmailTouched(true)
      setStudentEmailTouched(true)
      setCounselorEmailTouched(true)
      setError("Fix the email addresses below before submitting.")
      return
    }
    if (!eligibilityType) {
      setError("Pick an eligibility type.")
      return
    }
    if (!consent) {
      setError("Please check the consent box so we can contact the counselor.")
      return
    }

    setSubmitting(true)
    try {
      const res = await submitEligibilityApplication({
        studentName,
        parentName,
        email,
        studentEmail,
        grade,
        schoolName,
        eligibilityType,
        counselorEmail,
        consent,
        website,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setResult({ emailSent: res.emailSent })
    } catch {
      setError("Something went wrong sending your application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Access Pupil for free
      </h1>

      <div className="mt-10">
        {result ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              Application received
            </h2>
            {result.emailSent ? (
              <p className="mt-2 text-gray-600">
                We emailed your counselor at{" "}
                <span className="font-medium">{counselorEmail.trim()}</span> and
                copied you, so you&rsquo;ll see their reply too. Once they
                confirm, we&rsquo;ll turn on free access and let you know.
              </p>
            ) : (
              <p className="mt-2 text-gray-600">
                We saved your application, but couldn&rsquo;t email your
                counselor just now. We&rsquo;ll reach out to them ourselves and
                follow up with you at{" "}
                <span className="font-medium">{email.trim()}</span>.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-5">
            <form
              onSubmit={handleEligibilitySubmit}
              className="space-y-5 lg:col-span-3"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="studentName">Student name</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="parentName">Parent / guardian name</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Parent / guardian email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  required
                  className="mt-1.5"
                />
                <div className="mt-1.5">
                  <EmailHint
                    email={email}
                    showError={emailTouched}
                    onAccept={setEmail}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="studentEmail">
                  Student email{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="studentEmail"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  onBlur={() => setStudentEmailTouched(true)}
                  className="mt-1.5"
                />
                <div className="mt-1.5 space-y-1">
                  <EmailHint
                    email={studentEmail}
                    showError={studentEmailTouched}
                    onAccept={setStudentEmail}
                  />
                  <p className="text-xs text-gray-500">
                    The email the student uses (or will use) for their Pupil
                    account, so we can turn on free access for the right
                    account.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                  className="mt-1.5"
                >
                  <SelectOption value="" disabled>
                    Select grade
                  </SelectOption>
                  <SelectOption value="9">9th</SelectOption>
                  <SelectOption value="10">10th</SelectOption>
                  <SelectOption value="11">11th</SelectOption>
                  <SelectOption value="12">12th</SelectOption>
                </Select>
              </div>

              <div>
                <Label htmlFor="schoolName">School name</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  maxLength={160}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Eligibility type</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {ELIGIBILITY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={eligibilityType === type}
                      onClick={() => setEligibilityType(type)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        eligibilityType === type
                          ? "border-[#7A60E4] bg-[#7A60E4]/10 text-[#7A60E4]"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="counselorEmail">
                  School counselor email{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="counselorEmail"
                  type="email"
                  value={counselorEmail}
                  onChange={(e) => setCounselorEmail(e.target.value)}
                  onBlur={() => setCounselorEmailTouched(true)}
                  required
                  placeholder="counselor@school.edu"
                  className="mt-1.5"
                />
                <div className="mt-1.5">
                  <EmailHint
                    email={counselorEmail}
                    showError={counselorEmailTouched}
                    onAccept={setCounselorEmail}
                  />
                </div>
              </div>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-[#7A60E4] focus:ring-[#7A60E4]"
                />
                <span>{ELIGIBILITY_CONSENT_TEXT}</span>
              </label>

              <Button
                type="submit"
                className="w-full sm:w-auto"
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit application"
                )}
              </Button>
            </form>

            <aside className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">
                  What qualifies?
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A60E4]" />
                    Free/Reduced-Price Lunch (FRPL)
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A60E4]" />
                    SNAP benefits
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A60E4]" />
                    Common App fee waiver
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">
                  What happens next?
                </h3>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-gray-600">
                  <li>We email your school counselor and copy you.</li>
                  <li>Your counselor replies to confirm eligibility.</li>
                  <li>We turn on free access and let you know.</li>
                </ol>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
