"use client"

import Link from "next/link"

/* ---------- Hero ---------- */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-[#7A60E4]" />
          For Students
        </div>

        <h1 className="mx-auto max-w-3xl tracking-tighter text-5xl font-bold leading-[1.08] text-gray-900 md:text-7xl">
          Find colleges that feel like{" "}
          <em className="not-italic italic">home.</em>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
          Get matched with a mentor who actually gets your background, your goals, and what you are looking for in a school. No fluff -- just real guidance from someone who has been there.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center rounded-lg bg-[#7A60E4] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#6950d0] transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/access"
            className="inline-flex h-12 items-center rounded-lg border border-gray-200 bg-transparent px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Check Free Access
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- What You Get ---------- */

function WhatYouGetSection() {
  const cards = [
    {
      title: "Find your fit",
      description:
        "Explore schools that match who you are -- not just where your test scores land. Your mentor helps you build a college list based on your interests, identity, and what campus life actually feels like.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      ),
    },
    {
      title: "Real talk",
      description:
        "Honest conversations from people who have been there. Your mentor is a current college student or recent grad who remembers what applications, essays, and decision stress actually feel like.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      ),
    },
    {
      title: "Build your plan",
      description:
        "Structured guidance with action items after every session. After each call, you get a recap with what you covered, what to do next, and what to focus on before next time.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A60E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
      ),
    },
  ]

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7A60E4]">
            What you get
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Everything you need to navigate admissions
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
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
            What students say
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Hear from students like you
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
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

/* ---------- MentorGPT Waitlist ---------- */

function MentorGPTSection() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-[#7A60E4]">
            Coming Soon
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            MentorGPT
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
            AI-powered college guidance available 24/7. Ask questions about schools, essays, financial aid, and more -- powered by real mentor knowledge. Included free with all active subscriptions.
          </p>
          <Link
            href="/waitlist"
            className="mt-6 inline-flex h-12 items-center rounded-lg bg-[#7A60E4] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#6950d0] transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Closing CTA ---------- */

function ClosingCTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Ready to find your mentor?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-gray-600">
          Get matched with someone who gets your goals, your background, and your vibe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center rounded-lg bg-[#7A60E4] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#6950d0] transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/access"
            className="inline-flex h-12 items-center rounded-lg border border-gray-200 bg-transparent px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Check Free Access
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function StudentsPage() {
  return (
    <>
      <HeroSection />
      <WhatYouGetSection />
      <TestimonialsSection />
      <MentorGPTSection />
      <ClosingCTASection />
    </>
  )
}
