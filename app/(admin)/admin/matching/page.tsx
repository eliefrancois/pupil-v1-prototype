"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Star, UserPlus, CircleAlert as AlertCircle } from "lucide-react"
import { MATCHING_QUEUE, MENTORS } from "@/lib/mock-data"
import type { MatchingQueueItem, MatchingCandidate, Mentor } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function getMentor(id: string): Mentor | undefined {
  return MENTORS.find((m) => m.id === id)
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct > 85
      ? "bg-green-100 text-green-800"
      : pct > 70
        ? "bg-[#7A60E4]/10 text-[#7A60E4]"
        : "bg-gray-100 text-gray-600"
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", color)}>
      {pct}% match
    </span>
  )
}

function MatchCard({ item }: { item: MatchingQueueItem }) {
  const [expanded, setExpanded] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)

  const student = item.student
  const isAssigned = assignedTo !== null

  return (
    <Card className="overflow-hidden">
      {/* Collapsed row */}
      <button
        type="button"
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50"
        onClick={() => setExpanded((p) => !p)}
      >
        <Avatar alt={student.name} size="default" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{student.name}</span>
            <span className="text-xs text-gray-500">Grade {student.grade}</span>
            <span className="text-xs text-gray-400">{student.school}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {student.interests.map((i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {i}
              </Badge>
            ))}
            {student.colleges.map((c) => (
              <Badge key={c} variant="outline" className="text-[10px]">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAssigned ? (
            <Badge variant="success">Assigned</Badge>
          ) : (
            <Badge variant="warning">Awaiting match</Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
          {/* Identity tags */}
          <div className="mb-4 flex flex-wrap gap-2">
            {student.identity.map((tag) => (
              <Badge key={tag} variant="default" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {isAssigned ? (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Assigned to {assignedTo}
              </span>
            </div>
          ) : (
            <>
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Suggested mentors</h4>
              <div className="space-y-3">
                {item.candidates.map((candidate: MatchingCandidate) => {
                  const mentor = getMentor(candidate.mentorId)
                  if (!mentor) return null
                  return (
                    <div
                      key={candidate.mentorId}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <Avatar src={mentor.photo} alt={mentor.name} size="default" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{mentor.name}</span>
                          <span className="text-xs text-gray-500">{mentor.university}</span>
                          <span className="text-xs text-gray-400">{mentor.major}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {candidate.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                          <span>{mentor.activeMentees} mentees</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {mentor.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={candidate.score} />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAssignedTo(mentor.name)
                          }}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#7A60E4]"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                No suitable mentor &mdash; flag for recruitment
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export default function MatchingQueuePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Matching queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            {MATCHING_QUEUE.length} students awaiting mentor assignment
          </p>
        </div>

        <div className="space-y-4">
          {MATCHING_QUEUE.map((item) => (
            <MatchCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
