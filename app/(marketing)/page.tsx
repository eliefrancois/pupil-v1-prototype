"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MENTORS } from "@/lib/mock-data"
import { FAQ_ITEMS } from "@/lib/constants"

/* ---------- Hero ---------- */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left copy */}
          <div>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[#7A60E4]" />
              For Parents
            </div>

            <h1 className="tracking-tighter text-5xl font-bold leading-[1.08] text-gray-900 md:text-7xl">
              College guidance your family <em className="not-italic italic">can&nbsp;trust.</em>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
              Pupil connects your student with relatable near-peer college mentors who share their goals, identity, and vibe -- so they get guidance that actually fits.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center rounded-lg bg-[#7A60E4] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#6950d0] transition-colors"
              >
                Get Early Access
              </Link>
              <Link
                href="/access"
                className="inline-flex h-12 items-center rounded-lg border border-gray-200 bg-transparent px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Free or Pilot Access
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              {[
                { value: "560+", label: "Mentors" },
                { value: "450+", label: "Students supported" },
                { value: "105+", label: "Universities represented" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Floating mentor cards */}
          <div className="relative hidden h-[520px] lg:block">
            {/* Mentor card 1 */}
            <div className="absolute left-8 top-4 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Image
                  src={MENTORS[0].photo}
                  alt={MENTORS[0].name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{MENTORS[0].name}</p>
                  <p className="text-xs text-gray-500">{MENTORS[0].university}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="font-medium text-gray-700">{MENTORS[0].rating}</span>
                <span className="mx-1">&#183;</span>
                <span>{MENTORS[0].sessions} sessions</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {MENTORS[0].tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-[#7A60E4]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Mentor card 2 */}
            <div className="absolute right-4 top-40 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Image
                  src={MENTORS[2].photo}
                  alt={MENTORS[2].name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{MENTORS[2].name}</p>
                  <p className="text-xs text-gray-500">{MENTORS[2].university}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="font-medium text-gray-700">{MENTORS[2].rating}</span>
                <span className="mx-1">&#183;</span>
                <span>{MENTORS[2].sessions} sessions</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {MENTORS[2].tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-[#7A60E4]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Session reminder card */}
            <div className="absolute bottom-8 left-16 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Session Reminder</p>
                  <p className="text-xs text-gray-500">Tomorrow at 4:30 PM with {MENTORS[0].name.split(" ")[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- How It Works ---------- */

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Tell us about your student",
      description:
        "Share their interests, schools they are exploring, and what kind of mentor would be the best fit.",
    },
    {
      number: "02",
      title: "Get matched with a mentor",
      description:
        "Our matching engine pairs your student with a vetted near-peer mentor who shares relevant experience and identity.",
    },
    {
      number: "03",
      title: "Start building a plan",
      description:
        "Your student meets their mentor 2-4 times per month for structured, actionable sessions on college and career planning.",
    },
  ]

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Simple to start, <em className="not-italic italic">built to last.</em>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <span className="text-sm font-bold text-[#7A60E4]">{step.number}</span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Our Approach ---------- */

function OurApproachSection() {
  const cards = [
    {
      title: "Near-peer mentors",
      description:
        "Current college students and recent grads who remember what the process actually feels like.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ),
    },
    {
      title: "Identity-aware matching",
      description:
        "We match on interests, identity, and lived experience -- not just test scores or school rankings.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 10-5.12 5.12-2.83-2.83"/></svg>
      ),
    },
    {
      title: "Personalized guidance",
      description:
        "Every session ends with a breakdown of topics covered, action items, and a plan for next time.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
      ),
    },
    {
      title: "Matched within 24-48 hours",
      description:
        "No long waitlists. Your student is paired with a mentor and can book their first session right away.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ),
    },
  ]

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">
            Our approach
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            What makes Pupil different
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Mentors ---------- */

function MentorsSection() {
  const featured = MENTORS.slice(0, 4)

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">
            Meet our mentors
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Real students at top universities
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((mentor) => (
            <div
              key={mentor.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Image
                src={mentor.photo}
                alt={mentor.name}
                width={400}
                height={400}
                className="h-48 w-full rounded-xl object-cover"
              />
              <h3 className="mt-4 text-base font-semibold text-gray-900">{mentor.name}</h3>
              <p className="text-sm text-gray-500">{mentor.university}</p>
              <p className="text-xs text-gray-400">{mentor.major}</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span className="font-medium text-gray-700">{mentor.rating}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">{mentor.sessions} sessions</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/students"
            className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Browse all mentors
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Testimonials ---------- */

const TESTIMONIALS = [
  {
    quote:
      "Pupil isn't just mentorship, it's the forging of a path. My daughter now has someone who gets her experience and her ambition.",
    name: "Monica T.",
    role: "Parent, Brooklyn NY",
  },
  {
    quote:
      "What really stuck with me was how much I could relate to my mentor. She went through the same things I'm going through and it made me feel way less alone.",
    name: "Jaylen R.",
    role: "Student, 11th grade",
  },
  {
    quote:
      "My favorite part about using Pupil is how easy it is to connect with mentors who actually understand what I'm looking for in a school.",
    name: "Aaliyah M.",
    role: "Student, 12th grade",
  },
]

function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">
            Testimonials
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Families and students love Pupil
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-gray-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Pricing Teaser ---------- */

function PricingTeaserSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-md rounded-2xl border-2 border-[#7A60E4] bg-white p-10 text-center shadow-sm">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-[#7A60E4]">
            Early Access
          </div>
          <p className="text-5xl font-bold tracking-tight text-gray-900">$900<span className="text-lg font-medium text-gray-500">/year</span></p>
          <p className="mt-3 text-sm text-gray-500">
            Up to 24 sessions &middot; 90-day refund guarantee
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex h-12 items-center rounded-lg bg-[#7A60E4] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#6950d0] transition-colors"
          >
            View Pricing Details
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = FAQ_ITEMS.slice(0, 6)

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Common questions
          </h2>
        </div>

        <div className="mt-14 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
          {items.map((item, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium text-gray-900 pr-4">{item.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-gray-400 transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === i ? "max-h-[500px] pb-5" : "max-h-0"
                }`}
              >
                <p className="px-6 text-sm leading-relaxed text-gray-600">{item.a}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faqs"
            className="text-sm font-medium text-[#7A60E4] hover:underline"
          >
            View all FAQs &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <OurApproachSection />
      <MentorsSection />
      <TestimonialsSection />
      <PricingTeaserSection />
      <FAQSection />
    </>
  )
}
