import Link from 'next/link'

import BrandMark from '@/components/brand-mark'

const productLinks = [
  { label: 'For Parents', href: '/' },
  { label: 'For Students', href: '/students' },
  { label: 'Browse Mentors', href: '/mentors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'MentorGPT Waitlist', href: '/waitlist' },
]

const mentorLinks = [
  { label: 'Apply to Mentor', href: '/mentor-signup' },
  { label: 'Mentor Login', href: '/login' },
]

const companyLinks = [
  { label: 'Free Access', href: '/access' },
  { label: 'School Pilot', href: '#' },
  { label: 'Newsroom', href: '/newsroom' },
  { label: 'FAQs', href: '/faqs' },
]

const legalLinks = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Parental Consent', href: '/legal/parental-consent' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto max-w-page px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4">
            <BrandMark size="md" />
            <p className="max-w-xs text-[14px] leading-relaxed text-text-2">
              College guidance your family can trust. Near-peer mentors who get you.
            </p>
          </div>

          <div>
            <h3 className="tiny mb-3">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-text-2 transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tiny mb-3">Mentors</h3>
            <ul className="space-y-2">
              {mentorLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-text-2 transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tiny mb-3">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-text-2 transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tiny mb-3">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-text-2 transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-[12px] text-text-3">
            &copy; {new Date().getFullYear()} Pupil. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
