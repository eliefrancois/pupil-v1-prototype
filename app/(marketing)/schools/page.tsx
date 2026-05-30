'use client'

import Link from 'next/link'
import {
  BarChart3,
  Building2,
  CircleCheck,
  Eye,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

/* ---------- Hero ---------- */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-bg py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="default" className="mb-6 px-3 py-1.5 text-[12px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              For Schools &amp; Orgs
            </Badge>

            <h1 className="display text-[44px] leading-[1.05] md:text-[64px]">
              Mentorship your whole cohort{' '}
              <em className="italic font-normal">can&nbsp;rely on.</em>
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-text-2">
              Pupil gives counselors, districts, and nonprofit partners a way to
              put a vetted near-peer college mentor in front of every student,
              with the oversight and safety controls institutions need.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="mailto:dario@getpupil.com?subject=Bringing%20Pupil%20to%20our%20students">
                  Talk to our team
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/mentors">Browse mentors</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap gap-10">
              {[
                { value: '560+', label: 'Vetted mentors' },
                { value: '105+', label: 'Universities represented' },
                { value: '24hr', label: 'Flagged-content review' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="display text-[28px] leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[13px] text-text-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden h-[520px] lg:block">
            <Card className="absolute left-8 top-4 w-64 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                  <Building2 className="h-[18px] w-[18px] text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    Cohort overview
                  </p>
                  <p className="text-[12px] text-text-2">Spring rollout</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-[var(--radius-sm)] bg-surface-2 px-2 py-2">
                  <p className="display text-[20px] leading-none">128</p>
                  <p className="mt-1 text-[11px] text-text-2">Matched</p>
                </div>
                <div className="rounded-[var(--radius-sm)] bg-surface-2 px-2 py-2">
                  <p className="display text-[20px] leading-none">96%</p>
                  <p className="mt-1 text-[11px] text-text-2">Active</p>
                </div>
              </div>
            </Card>

            <Card className="absolute right-4 top-40 w-64 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                  <ShieldCheck className="h-[18px] w-[18px] text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    Trust &amp; Safety
                  </p>
                  <p className="text-[12px] text-text-2">All sessions logged</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-text-2">
                <CircleCheck className="h-3.5 w-3.5 text-success" />
                <span>0 open flags this week</span>
              </div>
            </Card>

            <Card className="absolute bottom-8 left-16 w-72 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                  <Users className="h-[18px] w-[18px] text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    New match confirmed
                  </p>
                  <p className="text-[12px] text-text-2">
                    First-gen student paired in 31 hours
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Why schools partner with Pupil ---------- */

function WhyPupilSection() {
  const cards = [
    {
      title: 'Vetted near-peer mentors',
      description:
        'Every mentor is a current college student or recent grad who has passed a background check and training. They get your students because they were recently in their seat.',
      icon: Users,
    },
    {
      title: 'Trust & Safety by default',
      description:
        'Sessions are recorded and transcribed, messaging is filtered for contact info, and any flagged interaction is reviewed by a human within 24 hours.',
      icon: ShieldCheck,
    },
    {
      title: 'Admin oversight & visibility',
      description:
        'Scoped admin access lets your team see participation, matches, and Trust & Safety flags for your cohort, without intruding on the student-mentor relationship.',
      icon: Eye,
    },
    {
      title: 'Easy cohort rollout',
      description:
        'Distribute bulk access codes to a class, grade, or program. Students redeem a code, set preferences, and get matched within 24 to 48 hours.',
      icon: Rocket,
    },
  ]

  return (
    <section className="border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="text-center">
          <p className="tiny text-primary">Why schools partner with Pupil</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-[28px] md:text-[44px]">
            Built for the people responsible for students
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light">
                  <Icon className="h-[18px] w-[18px] text-primary" />
                </div>
                <h3 className="text-[17px] font-semibold text-text">
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-2">
                  {card.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- How rollout works ---------- */

function HowRolloutWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Tell us about your cohort',
      description:
        'Share the students or program you want to support and how you measure success. We help you scope a pilot that fits your budget.',
    },
    {
      number: '02',
      title: 'We match and onboard',
      description:
        'Students redeem access codes, set preferences, and get paired with a relatable mentor within 24 to 48 hours. No long waitlists.',
    },
    {
      number: '03',
      title: 'Track participation and outcomes',
      description:
        'Your admin view shows who is active, who is matched, and any Trust & Safety flags, so you can report impact to your stakeholders.',
    },
  ]

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <p className="tiny text-primary">How rollout works</p>
        <h2 className="display mt-3 text-[28px] md:text-[44px]">
          Simple to launch,{' '}
          <em className="italic font-normal">easy to oversee.</em>
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number} className="p-7">
              <span className="text-[13px] font-semibold tracking-wide text-primary">
                {step.number}
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-2">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Outcomes / equity ---------- */

function OutcomesSection() {
  const points = [
    {
      title: 'Reaches first-gen and underserved students',
      description:
        'Free access is available for students who qualify through FRPL, SNAP, or Common App fee waivers, so cost is not what decides who gets guidance.',
      icon: Sparkles,
    },
    {
      title: 'Matches students to relatable mentors',
      description:
        'We pair on interests, identity, and lived experience, not just test scores, so students see someone who reflects where they come from and where they want to go.',
      icon: CircleCheck,
    },
    {
      title: 'Gives you something to report',
      description:
        'Session counts, match rates, and engagement give your team and funders a clear picture of how the program is landing with students.',
      icon: BarChart3,
    },
  ]

  return (
    <section className="border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="text-center">
          <p className="tiny text-primary">Outcomes that matter</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-[28px] md:text-[44px]">
            Guidance that reaches the students who need it most
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {points.map((point) => {
            const Icon = point.icon
            return (
              <Card key={point.title} className="p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light">
                  <Icon className="h-[18px] w-[18px] text-primary" />
                </div>
                <h3 className="text-[17px] font-semibold text-text">
                  {point.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-2">
                  {point.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Closing CTA ---------- */

function ClosingCTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-border bg-surface p-10 text-center shadow-sm">
          <h2 className="display text-[28px] md:text-[40px]">
            Bring Pupil to your students
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-text-2">
            Tell us about your school, district, or organization and we will
            help you scope a pilot for your cohort.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="mailto:dario@getpupil.com?subject=Bringing%20Pupil%20to%20our%20students">
                Talk to our team
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/access">Have an access code?</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function SchoolsPage() {
  return (
    <>
      <HeroSection />
      <WhyPupilSection />
      <HowRolloutWorksSection />
      <OutcomesSection />
      <ClosingCTASection />
    </>
  )
}
