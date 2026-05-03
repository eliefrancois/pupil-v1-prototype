"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectOption } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const ETHNICITY_OPTIONS = [
  "Asian",
  "Black / African American",
  "Hispanic / Latino",
  "Native American / Alaska Native",
  "Native Hawaiian / Pacific Islander",
  "White",
  "Middle Eastern / North African",
  "Two or more races",
  "Prefer not to say",
]

const TOPICS = [
  "Essay writing",
  "College list building",
  "Financial aid",
  "Test prep",
  "Major exploration",
  "Career planning",
  "Interview prep",
  "Campus visits",
  "Application timeline",
  "Extracurriculars",
]

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [grade, setGrade] = useState("")
  const [ethnicities, setEthnicities] = useState<string[]>([])
  const [firstGen, setFirstGen] = useState<string>("")
  const [schoolType, setSchoolType] = useState("")
  const [openQuestion, setOpenQuestion] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [trustQuestion, setTrustQuestion] = useState("")

  const toggleEthnicity = (value: string) => {
    setEthnicities((prev) =>
      prev.includes(value)
        ? prev.filter((e) => e !== value)
        : [...prev, value]
    )
  }

  const toggleTopic = (value: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(value)) {
        return prev.filter((t) => t !== value)
      }
      if (prev.length >= 5) return prev
      return [...prev, value]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: submit to API
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-[bounce_0.6s_ease-in-out]">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            You&rsquo;re on the list!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            We&rsquo;ll email you at <span className="font-medium">{email}</span>{" "}
            when MentorGPT is ready.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <span className="inline-flex items-center rounded-full bg-[#7A60E4]/10 px-3 py-1 text-sm font-semibold text-[#7A60E4]">
          Coming Soon
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Be the first to try MentorGPT
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          MentorGPT is an AI-powered college guidance tool that gives every
          student access to personalized, on-demand advice -- from essay
          feedback to financial aid guidance. Sign up to be notified when it
          launches. It will be included in all active Pupil subscriptions at
          no extra cost.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        {/* Name */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>

        {/* Email */}
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

        {/* Grade */}
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

        {/* Ethnicity (multi-select checkboxes) */}
        <fieldset>
          <legend className="text-sm font-medium leading-none">
            Ethnicity <span className="text-gray-400">(select all that apply)</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ETHNICITY_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={ethnicities.includes(option)}
                  onChange={() => toggleEthnicity(option)}
                  className="h-4 w-4 rounded border-gray-300 text-[#7A60E4] focus:ring-[#7A60E4]"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        {/* First-gen (radio) */}
        <fieldset>
          <legend className="text-sm font-medium leading-none">
            Would you be the first in your family to attend college?
          </legend>
          <div className="mt-2 flex gap-6">
            {["Yes", "No"].map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="firstGen"
                  value={option}
                  checked={firstGen === option}
                  onChange={(e) => setFirstGen(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-[#7A60E4] focus:ring-[#7A60E4]"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        {/* School type */}
        <div>
          <Label htmlFor="schoolType">School type</Label>
          <Select
            id="schoolType"
            value={schoolType}
            onChange={(e) => setSchoolType(e.target.value)}
            className="mt-1.5"
          >
            <SelectOption value="" disabled>
              Select school type
            </SelectOption>
            <SelectOption value="public">Public</SelectOption>
            <SelectOption value="private">Private</SelectOption>
            <SelectOption value="charter">Charter</SelectOption>
            <SelectOption value="homeschool">Homeschool</SelectOption>
          </Select>
        </div>

        {/* Open question */}
        <div>
          <Label htmlFor="openQuestion">
            What would you ask an AI college mentor?
          </Label>
          <Textarea
            id="openQuestion"
            value={openQuestion}
            onChange={(e) => setOpenQuestion(e.target.value)}
            rows={4}
            placeholder="Tell us what guidance you're looking for..."
            className="mt-1.5"
          />
        </div>

        {/* Topic checklist */}
        <fieldset>
          <legend className="text-sm font-medium leading-none">
            What topics interest you most?{" "}
            <span className="text-gray-400">(select up to 5)</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic)
              const isDisabled = !isSelected && selectedTopics.length >= 5
              return (
                <label
                  key={topic}
                  className={`flex items-center gap-2 text-sm cursor-pointer ${
                    isDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTopic(topic)}
                    disabled={isDisabled}
                    className="h-4 w-4 rounded border-gray-300 text-[#7A60E4] focus:ring-[#7A60E4] disabled:opacity-50"
                  />
                  {topic}
                </label>
              )
            })}
          </div>
        </fieldset>

        {/* Trust question */}
        <div>
          <Label htmlFor="trustQuestion">
            How would you feel about getting guidance from an AI?
          </Label>
          <Textarea
            id="trustQuestion"
            value={trustQuestion}
            onChange={(e) => setTrustQuestion(e.target.value)}
            rows={3}
            placeholder="Share your thoughts..."
            className="mt-1.5"
          />
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Join the waitlist
        </Button>
      </form>
    </div>
  )
}
