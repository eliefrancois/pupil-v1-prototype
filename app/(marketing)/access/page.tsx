"use client"

import { useState } from "react"
import { Check, Loader as Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectOption } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type EligibilityType = "SNAP" | "FRPL" | "Common App Waiver" | null
type CodeStatus = "idle" | "loading" | "success" | "error"

export default function AccessPage() {
  // Eligibility form state
  const [studentName, setStudentName] = useState("")
  const [parentName, setParentName] = useState("")
  const [email, setEmail] = useState("")
  const [grade, setGrade] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [eligibilityType, setEligibilityType] = useState<EligibilityType>(null)
  const [counselorEmail, setCounselorEmail] = useState("")
  const [eligibilitySubmitted, setEligibilitySubmitted] = useState(false)

  // Pilot code state
  const [pilotCode, setPilotCode] = useState("")
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle")

  const handleEligibilitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: submit to API
    setEligibilitySubmitted(true)
  }

  const handleCodeRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeStatus("loading")
    // TODO: validate code via API
    // Simulate API call
    setTimeout(() => {
      if (pilotCode.length === 6) {
        setCodeStatus("success")
        // TODO: redirect to onboarding
      } else {
        setCodeStatus("error")
      }
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Access Pupil for free
      </h1>

      <div className="mt-10">
        <Tabs defaultValue="eligibility">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="eligibility" className="flex-1 sm:flex-none">
              Eligibility
            </TabsTrigger>
            <TabsTrigger value="pilot" className="flex-1 sm:flex-none">
              Pilot Code
            </TabsTrigger>
          </TabsList>

          {/* ---------- Eligibility Tab ---------- */}
          <TabsContent value="eligibility">
            {eligibilitySubmitted ? (
              <div className="mt-8 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  Application received
                </h2>
                <p className="mt-2 text-gray-600">
                  We&rsquo;ve emailed your counselor at{" "}
                  <span className="font-medium">{counselorEmail}</span> to
                  verify your eligibility. You&rsquo;ll hear from us within
                  24&ndash;48 hours.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-10 lg:grid-cols-5">
                {/* Form */}
                <form
                  onSubmit={handleEligibilitySubmit}
                  className="space-y-5 lg:col-span-3"
                >
                  <div>
                    <Label htmlFor="studentName">Student name</Label>
                    <Input
                      id="studentName"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
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
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1.5"
                    />
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
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Eligibility type</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {(
                        ["SNAP", "FRPL", "Common App Waiver"] as const
                      ).map((type) => (
                        <button
                          key={type}
                          type="button"
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
                      required
                      placeholder="counselor@school.edu"
                      className="mt-1.5"
                    />
                  </div>

                  <Button type="submit" className="w-full sm:w-auto" size="lg">
                    Submit application
                  </Button>
                </form>

                {/* Side panel */}
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
                    <ol className="mt-3 space-y-2 text-sm text-gray-600 list-decimal list-inside">
                      <li>We email your school counselor to verify eligibility.</li>
                      <li>Once verified, you receive access within 24&ndash;48 hours.</li>
                      <li>You&rsquo;ll get an email with login instructions.</li>
                    </ol>
                  </div>
                </aside>
              </div>
            )}
          </TabsContent>

          {/* ---------- Pilot Code Tab ---------- */}
          <TabsContent value="pilot">
            <div className="mt-8 flex justify-center">
              <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                {codeStatus === "success" ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">
                      Code redeemed!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Redirecting you to onboarding...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCodeRedeem} className="space-y-5">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Enter your pilot code
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Codes are provided by your school or organization.
                      </p>
                    </div>

                    <Input
                      value={pilotCode}
                      onChange={(e) =>
                        setPilotCode(e.target.value.toUpperCase())
                      }
                      placeholder="XXXXXX"
                      className="text-center font-mono text-lg uppercase tracking-widest"
                      maxLength={10}
                      required
                    />

                    {codeStatus === "error" && (
                      <p className="text-center text-sm text-red-600">
                        Invalid or expired code. Please check and try again.
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={codeStatus === "loading"}
                    >
                      {codeStatus === "loading" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
