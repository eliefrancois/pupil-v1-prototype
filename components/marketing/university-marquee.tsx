import { cn } from '@/lib/utils'

/**
 * University logos sourced from /public/universities. The first four match
 * Pupil's mentor base in lib/mock-data.ts (Stanford, MIT, Yale, UC Berkeley);
 * the rest are well-known schools that ship with a logo asset. Only schools
 * with an actual logo file are listed here so no image 404s.
 */
const UNIVERSITIES = [
  { name: 'Stanford University', src: '/universities/stanford-logo.svg' },
  { name: 'MIT', src: '/universities/mit-logo.svg' },
  { name: 'Yale University', src: '/universities/yale-logo.svg' },
  { name: 'UC Berkeley', src: '/universities/california-logo.svg' },
  { name: 'Princeton University', src: '/universities/princeton-logo.svg' },
  { name: 'Georgetown University', src: '/universities/georgetown-logo.svg' },
  { name: 'New York University', src: '/universities/nyu-logo.svg' },
  { name: 'Georgia Tech', src: '/universities/georgia-tech-logo.svg' },
]

function Track({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-x-12 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
    >
      {UNIVERSITIES.map((uni) => (
        <li key={uni.name} className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVGs of mixed aspect ratios render cleanest with a fixed-height auto-width img */}
          <img
            src={uni.src}
            alt={ariaHidden ? '' : uni.name}
            className="h-9 w-auto transition"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </li>
      ))}
    </ul>
  )
}

export function UniversityMarquee({ className }: { className?: string }) {
  return (
    <section
      className={cn('border-y border-border bg-surface py-12', className)}
    >
      <div className="mx-auto max-w-page px-6">
        <p className="tiny text-center text-text-3">
          Mentors from 105+ universities nationwide
        </p>

        <div
          className="group relative mt-8 flex gap-x-12 overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <Track />
          <Track ariaHidden />
        </div>
      </div>
    </section>
  )
}
