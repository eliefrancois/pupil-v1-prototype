'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { CurrentUser } from '@/hooks/use-current-user'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  user: CurrentUser
  /**
   * "compact" shows just the avatar (for sidebars).
   * "full" shows avatar + name + chevron (for the navbar).
   */
  variant?: 'compact' | 'full'
  align?: 'start' | 'end'
}

export default function UserMenu({
  user,
  variant = 'full',
  align = 'end',
}: UserMenuProps) {
  const router = useRouter()
  const isPaid = user.subscription_status !== 'inactive'

  const dashboardHref =
    user.role === 'admin'
      ? '/admin'
      : user.role === 'mentor'
        ? '/mentor'
        : '/dashboard'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const trigger =
    variant === 'compact' ? (
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full outline-none ring-offset-bg transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Open user menu"
      >
        <Avatar
          alt={user.full_name || user.email}
          fallback={getInitials(user.full_name, user.email)}
          size="sm"
        />
      </button>
    ) : (
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-[13px] font-medium text-text outline-none transition-all hover:border-border-strong hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label="Open user menu"
      >
        <Avatar
          alt={user.full_name || user.email}
          fallback={getInitials(user.full_name, user.email)}
          size="sm"
        />
        <span className="max-w-[140px] truncate">
          {user.full_name?.split(' ')[0] || user.email.split('@')[0]}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-text-2" />
      </button>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-60 rounded-[var(--radius)] border-border bg-surface p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-3 py-2 font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold text-text">
              {user.full_name || 'Pupil member'}
            </p>
            <p className="truncate text-[12px] text-text-2">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={dashboardHref} className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-text-2" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        {user.role === 'student' && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-text-2" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4 text-text-2" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {!isPaid && user.role === 'student' && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                href="/pricing"
                className="flex items-center gap-2 text-primary focus:text-primary"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Upgrade plan</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-danger focus:bg-[rgba(239,68,68,0.08)] focus:text-danger"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getInitials(fullName: string, email: string) {
  const source = fullName?.trim() || email
  if (!source) return '?'
  return source
    .split(/[\s@]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}
