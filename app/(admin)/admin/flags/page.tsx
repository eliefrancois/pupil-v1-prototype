"use client"

import { useState } from "react"
import { Search, Eye, CircleCheck as CheckCircle, Circle as XCircle } from "lucide-react"
import { FLAGS } from "@/lib/mock-data"
import type { Flag } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FILTER_OPTIONS = ["All", "Messages", "Sessions", "Ratings", "Users"] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

const filterTypeMap: Record<FilterOption, string | null> = {
  All: null,
  Messages: "message",
  Sessions: "session",
  Ratings: "rating",
  Users: "user",
}

const severityBorder: Record<Flag["severity"], string> = {
  critical: "border-l-red-500",
  high: "border-l-red-500",
  medium: "border-l-yellow-400",
  low: "border-l-gray-300",
}

const severityBadge: Record<Flag["severity"], "danger" | "warning" | "secondary"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "secondary",
}

const typeBadge: Record<Flag["type"], "default" | "secondary"> = {
  message: "default",
  rating: "secondary",
  session: "secondary",
  user: "default",
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function FlagsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All")
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const filteredFlags = FLAGS.filter((flag) => {
    if (resolvedIds.has(flag.id)) return false
    const typeFilter = filterTypeMap[activeFilter]
    if (!typeFilter) return true
    return flag.type === typeFilter
  })

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(Array.from(prev))
      next.add(id)
      return next
    })
  }

  const handleDismiss = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(Array.from(prev))
      next.add(id)
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Safety flags</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every flag is reviewed by a human within 24 hours
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveFilter(option)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeFilter === option
                  ? "bg-[#7A60E4] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Flag cards */}
        <div className="space-y-4">
          {filteredFlags.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No flags match the current filter.
            </div>
          )}
          {filteredFlags.map((flag) => (
            <Card
              key={flag.id}
              className={cn("overflow-hidden border-l-4", severityBorder[flag.severity])}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityBadge[flag.severity]}>
                      {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
                    </Badge>
                    <Badge variant={typeBadge[flag.type]}>
                      {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatTime(flag.at)}</span>
                    <span className="text-xs text-gray-400">&middot;</span>
                    <span className="text-xs text-gray-500">Reported by {flag.by}</span>
                  </div>

                  {/* Preview */}
                  <p className="mt-2 text-sm italic text-gray-500">&ldquo;{flag.preview}&rdquo;</p>

                  {/* Full description */}
                  <p className="mt-1.5 text-sm text-gray-700">{flag.full}</p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    Investigate
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    className="gap-1.5"
                    onClick={() => handleResolve(flag.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-gray-500"
                    onClick={() => handleDismiss(flag.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
