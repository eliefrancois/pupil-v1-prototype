'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader as Loader2,
  MailCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { assignStudentMentor } from '@/lib/actions/admin-matching-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'

export interface StudentPendingRequest {
  id: string
  mentor_id: string
  mentor_name: string
  student_message: string | null
  requested_at: string
  claim_status: 'ghost' | 'claimed' | null
  claim_email_sent_at: string | null
}

interface MatchRowProps {
  student: {
    user_id: string
    full_name: string
    email: string
    matched_mentor_id: string | null
    matched_mentor_name: string | null
    grade: number | null
    city: string | null
    state: string | null
    interests: string[]
    colleges: string[]
    careers: string[]
    availability_slots: string[]
    created_at: string
    pending_requests: StudentPendingRequest[]
  }
  mentorOptions: {
    user_id: string
    full_name: string
    university: string
    major: string | null
    active_mentees_count: number
    max_mentees: number
    rating: number
    availability_slots: string[]
  }[]
}

function intersectionSize(a: string[], b: string[]): number {
  const set = new Set(a)
  let n = 0
  for (const item of b) if (set.has(item)) n++
  return n
}

function defaultMentorSelection(
  matchedMentorId: string | null,
  pendingRequests: StudentPendingRequest[],
  mentorOptions: MatchRowProps['mentorOptions']
): string {
  if (matchedMentorId) return matchedMentorId

  const optionIds = new Set(mentorOptions.map((m) => m.user_id))
  const claimedRequest = pendingRequests.find(
    (r) => r.claim_status === 'claimed' && optionIds.has(r.mentor_id)
  )
  if (claimedRequest) return claimedRequest.mentor_id

  const firstInOptions = pendingRequests.find((r) => optionIds.has(r.mentor_id))
  if (firstInOptions) return firstInOptions.mentor_id

  return ''
}

export default function MatchRow({ student, mentorOptions }: MatchRowProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(
    !student.matched_mentor_id || student.pending_requests.length > 0
  )
  const [selectedMentorId, setSelectedMentorId] = useState(() =>
    defaultMentorSelection(
      student.matched_mentor_id,
      student.pending_requests,
      mentorOptions
    )
  )
  const [error, setError] = useState('')

  const isMatched = !!student.matched_mentor_id
  const dirty = selectedMentorId !== (student.matched_mentor_id ?? '')

  const sortedMentors = useMemo(() => {
    const requestedIds = new Set(student.pending_requests.map((r) => r.mentor_id))
    return [...mentorOptions]
      .map((m) => ({
        ...m,
        overlap: intersectionSize(m.availability_slots, student.availability_slots),
        atCapacity: m.active_mentees_count >= m.max_mentees,
        requested: requestedIds.has(m.user_id),
      }))
      .sort((a, b) => {
        if (a.requested !== b.requested) return a.requested ? -1 : 1
        if (a.atCapacity !== b.atCapacity) return a.atCapacity ? 1 : -1
        return b.overlap - a.overlap
      })
  }, [mentorOptions, student.availability_slots, student.pending_requests])

  const selectedMentor = sortedMentors.find(
    (m) => m.user_id === selectedMentorId
  )

  const runAssign = (mentorId: string | null) => {
    setError('')
    startTransition(async () => {
      const result = await assignStudentMentor({
        studentId: student.user_id,
        mentorId,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-surface-2"
        onClick={() => setExpanded((p) => !p)}
      >
        <Avatar alt={student.full_name} size="default" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-text">
              {student.full_name || student.email}
            </span>
            {student.grade && (
              <span className="text-[12px] text-text-2">
                Grade {student.grade}
              </span>
            )}
            {(student.city || student.state) && (
              <span className="text-[12px] text-text-3">
                {[student.city, student.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-text-3">{student.email}</p>
          {student.pending_requests.length > 0 && !isMatched && (
            <p className="mt-1 text-[12px] text-primary">
              {student.pending_requests.length} mentor request
              {student.pending_requests.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isMatched ? (
            <Badge variant="success">
              Matched: {student.matched_mentor_name}
            </Badge>
          ) : (
            <Badge variant="warning">Unmatched</Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-3" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-3" />
          )}
        </div>
      </button>

      {expanded && (
        <CardContent className="space-y-5 border-t border-border bg-surface-2 p-5">
          {student.pending_requests.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-text-2">
                Student requested
              </p>
              <ul className="space-y-2">
                {student.pending_requests.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-text">
                        {req.mentor_name}
                      </span>
                      {req.claim_status === 'ghost' && (
                        <Badge variant="secondary">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Ghost
                        </Badge>
                      )}
                      <span className="text-[11px] text-text-3">
                        {timeAgo(req.requested_at)}
                      </span>
                    </div>
                    {req.claim_status === 'ghost' && req.claim_email_sent_at && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-text-3">
                        <MailCheck className="h-3 w-3" />
                        Claim email sent {timeAgo(req.claim_email_sent_at)}
                      </p>
                    )}
                    {req.student_message && (
                      <p className="mt-1.5 text-[12px] text-text-2">
                        &ldquo;{req.student_message}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <TagSection label="Interests" items={student.interests} />
            <TagSection label="Careers" items={student.careers} />
            <TagSection label="Colleges" items={student.colleges} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-text-2">
                Assign mentor
              </label>
              <span className="inline-flex items-center gap-1 text-[12px] text-text-3">
                <Calendar className="h-3 w-3" />
                Student has {student.availability_slots.length} slots set
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className="max-w-md flex-1"
              >
                <SelectOption value="">Select a mentor...</SelectOption>
                {sortedMentors.map((m) => (
                  <SelectOption key={m.user_id} value={m.user_id}>
                    {m.requested ? '★ ' : ''}
                    {m.full_name} {' \u00b7 '} {m.university} {' \u00b7 '}{' '}
                    {m.overlap} overlap {m.atCapacity ? '(full)' : ''}
                  </SelectOption>
                ))}
              </Select>
              <Button
                size="sm"
                onClick={() => runAssign(selectedMentorId || null)}
                disabled={!dirty || pending || !selectedMentorId}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </>
                ) : isMatched ? (
                  'Reassign'
                ) : (
                  'Assign'
                )}
              </Button>
              {isMatched && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMentorId('')
                    runAssign(null)
                  }}
                  disabled={pending}
                >
                  <X className="h-3.5 w-3.5" />
                  Unassign
                </Button>
              )}
            </div>
            {selectedMentor && (
              <div className="rounded-[var(--radius-sm)] bg-surface px-3 py-2 text-[12px] text-text-2">
                {selectedMentor.overlap > 0 ? (
                  <>
                    <span className="font-medium text-text">
                      {selectedMentor.overlap} overlapping slot
                      {selectedMentor.overlap === 1 ? '' : 's'}
                    </span>{' '}
                    with {student.full_name || 'this student'}.{' '}
                    {selectedMentor.atCapacity && (
                      <span className="text-warning">
                        Mentor is at capacity ({selectedMentor.active_mentees_count}
                        /{selectedMentor.max_mentees}).
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-warning">
                    No overlapping availability slots. Student or mentor will need
                    to add slots before they can book.
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-[var(--radius-sm)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-[12px] text-[#B91C1C]">
              {error}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function TagSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="tiny mb-2">{label}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-text-3">None</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
