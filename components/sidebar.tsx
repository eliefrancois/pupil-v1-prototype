"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Chrome as Home, User, Calendar, MessageCircle, List, Settings, Users, GraduationCap, BookOpen, Flag, Shield, Key, CircleCheck as CheckCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { NAV_STUDENT, NAV_MENTOR, NAV_ADMIN, type NavItem } from "@/lib/constants"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

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
  role: "student" | "mentor" | "admin"
  userName?: string
  userAvatar?: string | null
}

export default function Sidebar({ role, userName = "User", userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const items = navByRole[role] ?? NAV_STUDENT

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-gray-200 bg-gray-50/80 transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/" className={cn("flex items-center gap-1.5", collapsed && "justify-center")}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#7A60E4]" />
          {!collapsed && <span className="text-xl font-bold text-[#1A1A2E]">pupil</span>}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-[#7A60E4]/10 text-[#7A60E4]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <Avatar src={userAvatar} alt={userName} size="sm" />
          {!collapsed && (
            <span className="truncate text-sm font-medium text-gray-700">
              {userName}
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
