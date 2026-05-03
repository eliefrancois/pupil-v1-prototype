import Link from "next/link"
import { Check } from "lucide-react"

const features = [
  "Mentor matching",
  "Up to 24 1:1 sessions/year",
  "In-app messaging monitored for safety",
  "Session recordings + transcripts",
  "Pre-call icebreakers tailored to your student",
  "Post-call breakdowns with action items",
  "AI test prep (partner integration)",
  "90-day refund guarantee",
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[#7A60E4]">
          Early Access Pricing
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Invest in your student&rsquo;s <em>future.</em>
        </h1>
      </div>

      {/* Main pricing card */}
      <div className="mt-12 rounded-2xl border-2 border-[#7A60E4] bg-white p-8 shadow-xl sm:p-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-[#7A60E4]/10 px-3 py-1 text-sm font-semibold text-[#7A60E4]">
            Early Access
          </span>
        </div>

        <div className="mt-6">
          <span className="text-5xl font-bold tracking-tight text-gray-900">
            $900
          </span>
          <span className="text-lg font-medium text-gray-500">/year</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">$75/month equivalent</p>

        {/* Features list */}
        <ul className="mt-8 space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#7A60E4]" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Subscribe button */}
        <div className="mt-10">
          <Link
            href="/login"
            className="block w-full rounded-md bg-[#7A60E4] px-6 py-3 text-center text-base font-medium text-white shadow-sm hover:bg-[#6950d0] transition-colors"
          >
            Subscribe now
          </Link>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/access"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#7A60E4] transition-colors">
            Need free access?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            We offer free access for families who qualify. Check your eligibility
            or enter a pilot code.
          </p>
        </Link>

        <Link
          href="/access"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#7A60E4] transition-colors">
            School or organization?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            We work with schools and community-based organizations through bulk
            access codes.
          </p>
        </Link>
      </div>
    </div>
  )
}
