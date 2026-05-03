"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Clock, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function AccessConfirmationContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") ?? "pending"

  if (type === "approved") {
    return (
      <div className="flex flex-col items-center text-center">
        {/* Confetti-style celebration */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7A60E4]/10">
            <PartyPopper className="h-10 w-10 text-[#7A60E4]" />
          </div>
          {/* Decorative dots for confetti effect */}
          <span className="absolute -left-3 -top-1 h-3 w-3 rounded-full bg-yellow-400" />
          <span className="absolute -right-2 top-2 h-2 w-2 rounded-full bg-pink-400" />
          <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-blue-400" />
          <span className="absolute -bottom-2 right-0 h-3 w-3 rounded-full bg-green-400" />
          <span className="absolute -right-4 top-10 h-2.5 w-2.5 rounded-full bg-orange-400" />
          <span className="absolute -left-5 top-8 h-2 w-2 rounded-full bg-purple-400" />
        </div>

        <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          You&rsquo;re approved!
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Welcome to Pupil. Your free access is now active. Let&rsquo;s get
          your student matched with a mentor.
        </p>

        <div className="mt-8">
          <Link href="/onboarding">
            <Button size="lg" className="text-base px-8">
              Book Your First Session
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Default: pending state
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7A60E4]/10">
        <Check className="h-10 w-10 text-[#7A60E4]" />
      </div>

      <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Application submitted
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Our team will review your application and verify your eligibility.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">
          24&ndash;48 hours
        </span>
      </div>

      <div className="mt-8 max-w-md rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="font-semibold text-gray-900">What happens next?</h2>
        <ul className="mt-3 space-y-3 text-sm text-gray-600 text-left">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#7A60E4]/10 text-xs font-semibold text-[#7A60E4]">
              1
            </span>
            We&rsquo;ve contacted your school counselor to verify your
            eligibility.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#7A60E4]/10 text-xs font-semibold text-[#7A60E4]">
              2
            </span>
            Once your counselor confirms, we&rsquo;ll activate your free
            access.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#7A60E4]/10 text-xs font-semibold text-[#7A60E4]">
              3
            </span>
            You&rsquo;ll receive an email with instructions to get started.
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function AccessConfirmationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A60E4]" />
          </div>
        }
      >
        <AccessConfirmationContent />
      </Suspense>
    </div>
  )
}
