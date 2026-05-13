'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import BrandMark from '@/components/brand-mark'
import UserMenu from '@/components/user-menu'
import { cn } from '@/lib/utils'
import type { CurrentUser } from '@/hooks/use-current-user'

const links = [
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Mentors', href: '/mentors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faqs' },
]

interface NavbarProps {
  initialUser: CurrentUser | null
}

export default function Navbar({ initialUser }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const dashboardHref =
    initialUser?.role === 'admin'
      ? '/admin'
      : initialUser?.role === 'mentor'
        ? '/mentor'
        : '/dashboard'

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border"
      style={{
        background: 'rgba(251,250,247,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between px-6">
        <BrandMark size="md" />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'text-[14px] font-medium transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-text-2'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {initialUser ? (
            <UserMenu user={initialUser} variant="full" />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get started free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-2 transition-colors hover:bg-surface-2 hover:text-text md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="space-y-1 px-6 pb-4 pt-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-[var(--radius-sm)] px-3 py-2 text-[14px] font-medium transition-colors hover:bg-surface-2',
                  pathname === link.href ? 'text-primary' : 'text-text-2'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {initialUser ? (
                <>
                  <Button asChild>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                    >
                      Go to dashboard
                    </Link>
                  </Button>
                  <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-[13px] font-medium text-text">
                        {initialUser.full_name || 'Pupil member'}
                      </p>
                      <p className="truncate text-[12px] text-text-2">
                        {initialUser.email}
                      </p>
                    </div>
                    <UserMenu user={initialUser} variant="compact" />
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Get started free
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
