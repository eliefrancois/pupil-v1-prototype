'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Chrome as Home,
  User,
  Calendar,
  MessageCircle,
  List,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  Flag,
  Shield,
  Key,
  CircleCheck as CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

import { NAV_STUDENT, NAV_MENTOR, NAV_ADMIN, type NavItem } from '@/lib/constants'
import BrandMark from '@/components/brand-mark'
import UserMenu from '@/components/user-menu'
import { cn } from '@/lib/utils'
import type { CurrentUser } from '@/hooks/use-current-user'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  User,
  Calendar,
  MessageCircle,
  List,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  Flag,
  Shield,
  Key,
  CheckCircle,
}

const navByRole: Record<string, NavItem[]> = {
  student: NAV_STUDENT,
  mentor: NAV_MENTOR,
  admin: NAV_ADMIN,
}

interface SidebarProps {
  role: 'student' | 'mentor' | 'admin'
  user: CurrentUser | null
}

export default function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const items = navByRole[role] ?? NAV_STUDENT

  return (
    <aside
      className={cn(
        'sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[244px]'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {collapsed ? (
          <Link
            href="/"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary"
            aria-label="Pupil home"
          >
            <span className="text-xs font-semibold text-white">P</span>
          </Link>
        ) : (
          <BrandMark size="sm" />
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-[var(--radius-sm)] p-1 text-text-3 transition-colors hover:bg-surface-2 hover:text-text-2"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-2 hover:bg-surface-2 hover:text-text'
                  )}
                >
                  {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-3 py-3">
        {user ? (
          collapsed ? (
            <div className="flex justify-center">
              <UserMenu user={user} variant="compact" align="end" />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-1 py-1">
              <UserMenu user={user} variant="compact" align="end" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-text">
                  {user.full_name || 'Pupil member'}
                </span>
                <span className="truncate text-[11px] text-text-3 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          )
        ) : null}
      </div>
    </aside>
  )
}
