"use client"

import Link from "next/link"
import { TriangleAlert as AlertTriangle, Flag, Users, GraduationCap, ShieldAlert, Zap, CircleCheck as CheckCircle, Key, MessageCircle, ChevronRight } from "lucide-react"
import StatCard from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ACTIVITY_FEED = [
  {
    id: "a1",
    icon: ShieldAlert,
    iconColor: "text-red-500",
    description: "Critical safety flag opened — student reported concern in session feedback",
    time: "12 min ago",
  },
  {
    id: "a2",
    icon: Zap,
    iconColor: "text-[#7A60E4]",
    description: "Auto-match: Jordan Tate matched with Priya Raman (94% score)",
    time: "1 hr ago",
  },
  {
    id: "a3",
    icon: CheckCircle,
    iconColor: "text-green-500",
    description: "Eligibility approved — Tasha Williams (SNAP, Roosevelt HS)",
    time: "2 hrs ago",
  },
  {
    id: "a4",
    icon: Key,
    iconColor: "text-yellow-600",
    description: "24 of 30 access codes used — EAGLES-2026-A1 (Eastlake High School)",
    time: "5 hrs ago",
  },
  {
    id: "a5",
    icon: MessageCircle,
    iconColor: "text-orange-500",
    description: "Contact-info filter triggered — mentor message modified (Jonas Lindqvist)",
    time: "Yesterday",
  },
]

const QUICK_ACTIONS = [
  {
    id: "qa1",
    href: "/admin/matching",
    title: "Matching queue",
    description: "4 students awaiting match",
    icon: Users,
    badgeText: "4",
    badgeVariant: "warning" as const,
  },
  {
    id: "qa2",
    href: "/admin/flags",
    title: "Critical flag alert",
    description: "1 flag requires immediate review",
    icon: Flag,
    badgeText: "Critical",
    badgeVariant: "danger" as const,
  },
  {
    id: "qa3",
    href: "/admin/eligibility",
    title: "Eligibility application pending",
    description: "3 applications awaiting review",
    icon: CheckCircle,
    badgeText: "3",
    badgeVariant: "default" as const,
  },
]

export default function AdminDashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Trust &amp; Safety dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending matches"
            value={4}
            trend="Requires attention"
            tone="warning"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Active flags"
            value={4}
            trend="1 critical"
            tone="danger"
            icon={<Flag className="h-5 w-5" />}
          />
          <StatCard
            label="Total students"
            value="1,840"
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            label="Total mentors"
            value={142}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: Activity feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {ACTIVITY_FEED.map((item) => {
                    const Icon = item.icon
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className={`mt-0.5 shrink-0 ${item.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700">{item.description}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Quick actions */}
          <div className="space-y-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.id} href={action.href}>
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-md bg-gray-100 p-2.5 text-gray-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                          <Badge variant={action.badgeVariant}>{action.badgeText}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
