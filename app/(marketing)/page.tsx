'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, CircleCheck, Clock, PenLine, Star, Users } from 'lucide-react'

import { MENTORS } from '@/lib/mock-data'
import { FAQ_ITEMS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { UniversityMarquee } from '@/components/marketing/university-marquee'

/* ---------- Hero ---------- */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-bg py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="default" className="mb-6 px-3 py-1.5 text-[12px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              For Parents
            </Badge>

            <h1 className="display text-[44px] leading-[1.05] md:text-[64px]">
              College guidance your family{' '}
              <em className="italic font-normal">can&nbsp;trust.</em>
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-text-2">
              Pupil connects your student with relatable near-peer college
              mentors who share their goals, identity, and vibe, so they get
              guidance that actually fits.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Get started free</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/mentors">Browse mentors</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap gap-10">
              {[
                { value: '560+', label: 'Mentors' },
                { value: '450+', label: 'Students supported' },
                { value: '105+', label: 'Universities represented' },
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
                <Image
                  src={MENTORS[0].photo}
                  alt={MENTORS[0].name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    {MENTORS[0].name}
                  </p>
                  <p className="text-[12px] text-text-2">
                    {MENTORS[0].university}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[12px] text-text-2">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium text-text">
                  {MENTORS[0].rating}
                </span>
                <span className="mx-1 text-text-3">&middot;</span>
                <span>{MENTORS[0].sessions} sessions</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {MENTORS[0].tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="purple" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="absolute right-4 top-40 w-64 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Image
                  src={MENTORS[2].photo}
                  alt={MENTORS[2].name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    {MENTORS[2].name}
                  </p>
                  <p className="text-[12px] text-text-2">
                    {MENTORS[2].university}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[12px] text-text-2">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium text-text">
                  {MENTORS[2].rating}
                </span>
                <span className="mx-1 text-text-3">&middot;</span>
                <span>{MENTORS[2].sessions} sessions</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {MENTORS[2].tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="purple" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="absolute bottom-8 left-16 w-72 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                  <Calendar className="h-[18px] w-[18px] text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">
                    Session Reminder
                  </p>
                  <p className="text-[12px] text-text-2">
                    Tomorrow at 4:30 PM with {MENTORS[0].name.split(' ')[0]}
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

/* ---------- How It Works ---------- */

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Tell us about your student',
      description:
        'Share their interests, schools they are exploring, and what kind of mentor would be the best fit.',
    },
    {
      number: '02',
      title: 'Get matched with a mentor',
      description:
        'Our matching engine pairs your student with a vetted near-peer mentor who shares relevant experience and identity.',
    },
    {
      number: '03',
      title: 'Start building a plan',
      description:
        'Your student meets their mentor 2 to 4 times per month for structured, actionable sessions on college and career planning.',
    },
  ]

  return (
    <section
      id="how-it-works"
      className="border-y border-border bg-surface py-20 md:py-28"
    >
      <div className="mx-auto max-w-page px-6">
        <p className="tiny text-primary">How it works</p>
        <h2 className="display mt-3 text-[28px] md:text-[44px]">
          Simple to start,{' '}
          <em className="italic font-normal">built to last.</em>
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

/* ---------- Our Approach ---------- */

function OurApproachSection() {
  const cards = [
    {
      title: 'Near-peer mentors',
      description:
        'Current college students and recent grads who remember what the process actually feels like.',
      icon: Users,
    },
    {
      title: 'Identity-aware matching',
      description:
        'We match on interests, identity, and lived experience, not just test scores or school rankings.',
      icon: CircleCheck,
    },
    {
      title: 'Personalized guidance',
      description:
        'Every session ends with a breakdown of topics covered, action items, and a plan for next time.',
      icon: PenLine,
    },
    {
      title: 'Matched within 24 to 48 hours',
      description:
        'No long waitlists. Your student is paired with a mentor and can book their first session right away.',
      icon: Clock,
    },
  ]

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="text-center">
          <p className="tiny text-primary">Our approach</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-[28px] md:text-[44px]">
            What makes Pupil different
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

/* ---------- Mentors ---------- */

function MentorsSection() {
  const featured = MENTORS.slice(0, 4)

  return (
    <section
      id="mentors"
      className="border-y border-border bg-surface py-20 md:py-28"
    >
      <div className="mx-auto max-w-page px-6">
        <div className="text-center">
          <p className="tiny text-primary">Meet our mentors</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-[28px] md:text-[44px]">
            Real students at top universities
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((mentor) => (
            <Card key={mentor.id} className="p-5" hover>
              <Image
                src={mentor.photo}
                alt={mentor.name}
                width={400}
                height={400}
                className="h-44 w-full rounded-[var(--radius-sm)] object-cover"
              />
              <h3 className="mt-4 text-[15px] font-semibold text-text">
                {mentor.name}
              </h3>
              <p className="text-[13px] text-text-2">{mentor.university}</p>
              <p className="text-[12px] text-text-3">{mentor.major}</p>
              <div className="mt-3 flex items-center gap-2 text-[13px]">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="font-medium text-text">{mentor.rating}</span>
                </div>
                <span className="text-text-3">|</span>
                <span className="text-text-2">{mentor.sessions} sessions</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="secondary" asChild>
            <Link href="/mentors">Browse all mentors</Link>
          </Button>
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
    name: 'Monica T.',
    role: 'Parent, Brooklyn NY',
  },
  {
    quote:
      "What really stuck with me was how much I could relate to my mentor. She went through the same things I'm going through and it made me feel way less alone.",
    name: 'Jaylen R.',
    role: 'Student, 11th grade',
  },
  {
    quote:
      "My favorite part about using Pupil is how easy it is to connect with mentors who actually understand what I'm looking for in a school.",
    name: 'Aaliyah M.',
    role: 'Student, 12th grade',
  },
]

function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="text-center">
          <p className="tiny text-primary">Testimonials</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-[28px] md:text-[44px]">
            Families and students love Pupil
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="p-7">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-warning text-warning"
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-[14px] leading-relaxed text-text">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="text-[13px] font-semibold text-text">{t.name}</p>
                <p className="text-[12px] text-text-2">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Pricing Teaser ---------- */

function PricingTeaserSection() {
  return (
    <section className="border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-page px-6">
        <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border-2 border-primary bg-bg p-10 text-center shadow">
          <Badge variant="default" className="mb-4">
            Early Access
          </Badge>
          <p className="display text-[56px] leading-none">
            $900
            <span className="text-[16px] font-medium text-text-2">/year</span>
          </p>
          <p className="mt-3 text-[14px] text-text-2">
            Up to 24 sessions &middot; 90-day refund guarantee
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/signup">Get started free</Link>
          </Button>
          <p className="mt-3 text-[12px] text-text-3">
            Sign up free, upgrade when you&apos;re ready
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */

function FAQSection() {
  const items = FAQ_ITEMS.slice(0, 6)

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="tiny text-primary">FAQ</p>
          <h2 className="display mt-3 text-[28px] md:text-[44px]">
            Common questions
          </h2>
        </div>

        <Card className="mt-12 px-6">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="leading-relaxed">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/faqs"
            className="text-[14px] font-medium text-primary hover:underline"
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
      <UniversityMarquee />
      <HowItWorksSection />
      <OurApproachSection />
      <MentorsSection />
      <TestimonialsSection />
      <PricingTeaserSection />
      <FAQSection />
    </>
  )
}
