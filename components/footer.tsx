import Link from "next/link"

const productLinks = [
  { label: "For Parents", href: "/" },
  { label: "For Students", href: "/students" },
  { label: "Pricing", href: "/pricing" },
  { label: "MentorGPT Waitlist", href: "/waitlist" },
]

const companyLinks = [
  { label: "Free Access", href: "/access" },
  { label: "School Pilot", href: "#" },
  { label: "Newsroom", href: "/newsroom" },
  { label: "FAQs", href: "/faqs" },
]

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Parental Consent", href: "/legal/parental-consent" },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7A60E4]" />
              <span className="text-xl font-bold text-[#1A1A2E]">pupil</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              College guidance your family can trust. Near-peer mentors who get you.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Pupil. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
