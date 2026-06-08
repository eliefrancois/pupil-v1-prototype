'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Loader as Loader2,
  MailCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { assignStudentMentor } from '@/lib/actions/admin-matching-actions'
import { labelForCode } from '@/lib/identity-taxonomy'
import {
  scoreMatch,
  matchTier,
  type MatchScore,
  type ScoreMentee,
  type ScoreMentor,
  type DimensionBreakdown,
} from '@/lib/matching/match-score'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface StudentPendingRequest {
  id: string
  mentor_id: string
  mentor_name: string
  student_message: string | null
  requested_at: string
  claim_status: 'ghost' | 'claimed' | null
  claim_email_sent_at: string | null
}

/** Canonical-taxonomy data the scorer reads for a mentee (student). */
export type MatchMentee = ScoreMentee

export interface MatchMentorOption {
  user_id: string
  full_name: string
  university: string
  major: string | null
  active_mentees_count: number
  max_mentees: number
  rating: number
  availability_slot_count: number
  claim_status: string | null
  assignable: boolean
  /** Canonical-taxonomy attributes the scorer reads for a mentor. */
  match: ScoreMentor
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
    created_at: string
    pending_requests: StudentPendingRequest[]
    match: MatchMentee
  }
  mentorOptions: MatchMentorOption[]
}

type ScoredMentor = MatchMentorOption & {
  score: MatchScore
  atCapacity: boolean
  requested: boolean
}

/** How many ranked mentors to show before the "show all" toggle. */
const COLLAPSED_MENTOR_LIMIT = 6

function menteeHasMatchData(mentee: MatchMentee): boolean {
  const { academic_identity, first_gen, race_ethnicity, fit_preferences } =
    mentee
  const lists = [
    academic_identity,
    first_gen,
    race_ethnicity,
    fit_preferences?.career_pref,
    fit_preferences?.college_experience_pref,
  ]
  return lists.some((l) => Array.isArray(l) && l.length > 0)
}

export default function MatchRow({ student, mentorOptions }: MatchRowProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(
    !student.matched_mentor_id || student.pending_requests.length > 0
  )
  const [openBreakdowns, setOpenBreakdowns] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState('')
  const [pendingMentorId, setPendingMentorId] = useState<string | null>(null)

  const isMatched = !!student.matched_mentor_id
  const hasData = useMemo(
    () => menteeHasMatchData(student.match),
    [student.match]
  )

  // Score every approved mentor against this mentee, then rank by strength.
  const scoredMentors = useMemo<ScoredMentor[]>(() => {
    const requestedIds = new Set(
      student.pending_requests.map((r) => r.mentor_id)
    )
    return mentorOptions
      .map((m) => ({
        ...m,
        score: scoreMatch(student.match, m.match),
        atCapacity: m.active_mentees_count >= m.max_mentees,
        requested: requestedIds.has(m.user_id),
      }))
      .sort((a, b) => {
        // Primary: match strength. Then requested, assignable, capacity, rating.
        if (b.score.overall !== a.score.overall)
          return b.score.overall - a.score.overall
        if (a.requested !== b.requested) return a.requested ? -1 : 1
        if (a.assignable !== b.assignable) return a.assignable ? -1 : 1
        if (a.atCapacity !== b.atCapacity) return a.atCapacity ? 1 : -1
        return b.rating - a.rating
      })
  }, [mentorOptions, student.match, student.pending_requests])

  const visibleMentors =
    showAll || scoredMentors.length <= COLLAPSED_MENTOR_LIMIT
      ? scoredMentors
      : scoredMentors.slice(0, COLLAPSED_MENTOR_LIMIT)

  const runAssign = (mentorId: string | null) => {
    setError('')
    setPendingMentorId(mentorId)
    startTransition(async () => {
      const result = await assignStudentMentor({
        studentId: student.user_id,
        mentorId,
      })
      setPendingMentorId(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const toggleBreakdown = (mentorId: string) => {
    setOpenBreakdowns((prev) => {
      const next = new Set(prev)
      if (next.has(mentorId)) next.delete(mentorId)
      else next.add(mentorId)
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={150}>
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
                            Ghost · not assignable
                          </Badge>
                        )}
                        <span className="text-[11px] text-text-3">
                          {timeAgo(req.requested_at)}
                        </span>
                      </div>
                      {req.claim_status === 'ghost' &&
                        req.claim_email_sent_at && (
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

            <MenteeMatchProfile mentee={student.match} hasData={hasData} />

            <div className="grid gap-4 sm:grid-cols-3">
              <TagSection label="Interests" items={student.interests} />
              <TagSection label="Careers" items={student.careers} />
              <TagSection label="Colleges" items={student.colleges} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-text-2">
                  Ranked by match strength
                </label>
                {!hasData && (
                  <span className="text-[11px] text-text-3">
                    Scores need the student&rsquo;s identity answers
                  </span>
                )}
              </div>

              {scoredMentors.length === 0 ? (
                <p className="text-[12px] text-text-3">
                  No approved mentors yet. Mentors must be claimed (not ghost)
                  and have at least one availability slot to be assignable.
                </p>
              ) : (
                <div className="space-y-2">
                  {visibleMentors.map((mentor) => (
                    <MentorMatchCard
                      key={mentor.user_id}
                      mentor={mentor}
                      isCurrentMatch={
                        student.matched_mentor_id === mentor.user_id
                      }
                      isMatched={isMatched}
                      breakdownOpen={openBreakdowns.has(mentor.user_id)}
                      onToggleBreakdown={() => toggleBreakdown(mentor.user_id)}
                      onAssign={() => runAssign(mentor.user_id)}
                      onUnassign={() => runAssign(null)}
                      pending={pending}
                      pendingMentorId={pendingMentorId}
                    />
                  ))}
                  {scoredMentors.length > COLLAPSED_MENTOR_LIMIT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAll((p) => !p)}
                    >
                      {showAll
                        ? 'Show top matches only'
                        : `Show all ${scoredMentors.length} mentors`}
                    </Button>
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
    </TooltipProvider>
  )
}

// ---------- Mentee match profile (what drives the scores) ----------
function MenteeMatchProfile({
  mentee,
  hasData,
}: {
  mentee: MatchMentee
  hasData: boolean
}) {
  if (!hasData) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-dashed border-line bg-surface px-3 py-2.5">
        <p className="text-[12px] text-text-3">
          This student hasn&rsquo;t completed the identity / fit questions yet,
          so match strength can&rsquo;t be computed. You can still assign a
          mentor manually below.
        </p>
      </div>
    )
  }

  const groups: { key: string; label: string; codes: string[] }[] = [
    {
      key: 'academic_identity',
      label: 'Academic identity',
      codes: mentee.academic_identity ?? [],
    },
    {
      key: 'career_aspirations',
      label: 'Careers they want to explore',
      codes: mentee.fit_preferences?.career_pref ?? [],
    },
    {
      key: 'college_experience',
      label: 'College experience they want',
      codes: mentee.fit_preferences?.college_experience_pref ?? [],
    },
    {
      key: 'first_gen',
      label: 'First-gen / family background',
      codes: mentee.first_gen ?? [],
    },
    {
      key: 'race_ethnicity',
      label: 'Race / ethnicity',
      codes: mentee.race_ethnicity ?? [],
    },
  ].filter((g) => g.codes.length > 0)

  return (
    <div className="space-y-2 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-3">
      <p className="text-[12px] font-medium text-text-2">
        Match profile (drives the scores below)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="tiny mb-1.5">{g.label}</p>
            <div className="flex flex-wrap gap-1">
              {g.codes.map((code) => (
                <Badge key={code} variant="secondary">
                  {labelForCode(g.key, code)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- A single ranked mentor card ----------
function MentorMatchCard({
  mentor,
  isCurrentMatch,
  isMatched,
  breakdownOpen,
  onToggleBreakdown,
  onAssign,
  onUnassign,
  pending,
  pendingMentorId,
}: {
  mentor: ScoredMentor
  isCurrentMatch: boolean
  isMatched: boolean
  breakdownOpen: boolean
  onToggleBreakdown: () => void
  onAssign: () => void
  onUnassign: () => void
  pending: boolean
  pendingMentorId: string | null
}) {
  const tier = matchTier(mentor.score)
  const hasScore = mentor.score.scoredWeight > 0
  const isThisPending = pending && pendingMentorId === mentor.user_id

  const notAssignableReason = !mentor.assignable
    ? mentor.claim_status === 'ghost'
      ? 'Ghost mentor — can’t assign until they claim their profile.'
      : 'No availability set yet — needs at least one weekly slot.'
    : null

  return (
    <div
      className={
        'rounded-[var(--radius-sm)] border bg-surface ' +
        (isCurrentMatch ? 'border-[var(--success)]' : 'border-line')
      }
    >
      <div className="flex items-start gap-3 p-3">
        <ScoreBadge score={mentor.score.overall} tier={tier} hasScore={hasScore} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-text">
              {mentor.full_name || 'Unnamed mentor'}
            </span>
            {mentor.requested && (
              <Badge variant="default">★ Requested</Badge>
            )}
            {isCurrentMatch && <Badge variant="success">Current match</Badge>}
            {!mentor.assignable && (
              <Badge variant="secondary">Not assignable</Badge>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-text-3">
            {mentor.university}
            {mentor.major ? ` · ${mentor.major}` : ''}
            {' · '}
            {mentor.availability_slot_count} slot
            {mentor.availability_slot_count === 1 ? '' : 's'}
            {mentor.atCapacity
              ? ` · full (${mentor.active_mentees_count}/${mentor.max_mentees})`
              : ''}
          </p>

          {/* Shared-signal summary chips */}
          <SharedSignalSummary breakdown={mentor.score.breakdown} />

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleBreakdown}
              className="flex items-center gap-1 text-[11px] font-medium text-text-2 hover:text-text"
            >
              {breakdownOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {breakdownOpen ? 'Hide breakdown' : 'Why this score'}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isCurrentMatch ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUnassign}
              disabled={pending}
            >
              {isThisPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                  Unassign
                </>
              )}
            </Button>
          ) : notAssignableReason ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" variant="secondary" disabled>
                    {isMatched ? 'Reassign' : 'Assign'}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{notAssignableReason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button size="sm" onClick={onAssign} disabled={pending}>
              {isThisPending ? (
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
          )}
        </div>
      </div>

      {breakdownOpen && (
        <div className="space-y-2 border-t border-line bg-surface-2 p-3">
          {mentor.score.breakdown.map((dim) => (
            <DimensionRow key={dim.key} dim={dim} />
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreBadge({
  score,
  tier,
  hasScore,
}: {
  score: number
  tier: ReturnType<typeof matchTier>
  hasScore: boolean
}) {
  const tone =
    tier === 'strong'
      ? 'text-[#047857] bg-[rgba(16,185,129,0.12)]'
      : tier === 'moderate'
        ? 'text-[#92400E] bg-[rgba(245,158,11,0.14)]'
        : tier === 'weak'
          ? 'text-text-2 bg-surface-2'
          : 'text-text-3 bg-surface-2'

  return (
    <div
      className={
        'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-sm)] ' +
        tone
      }
      title={hasScore ? `Match strength ${score}/100` : 'No match data'}
    >
      <span className="text-[16px] font-semibold leading-none">
        {hasScore ? score : '—'}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-80">
        match
      </span>
    </div>
  )
}

function SharedSignalSummary({
  breakdown,
}: {
  breakdown: DimensionBreakdown[]
}) {
  const overlaps = breakdown.filter((d) => d.status === 'overlap')
  if (overlaps.length === 0) {
    return (
      <p className="mt-1 text-[11px] text-text-3">
        No shared signals on the weighted dimensions.
      </p>
    )
  }
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {overlaps.map((d) => (
        <span
          key={d.key}
          className="inline-flex items-center gap-1 rounded-full bg-[rgba(16,185,129,0.1)] px-2 py-0.5 text-[10px] font-medium text-[#047857]"
        >
          {d.label} · {d.sharedCodes.length}
        </span>
      ))}
    </div>
  )
}

function DimensionRow({ dim }: { dim: DimensionBreakdown }) {
  const pct =
    dim.status === 'no_data' ? 0 : Math.round(dim.ratio * 100)
  const variant =
    dim.status === 'overlap'
      ? 'success'
      : dim.status === 'no_overlap'
        ? 'warning'
        : 'default'

  return (
    <div className="rounded-[var(--radius-sm)] bg-surface px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-text">{dim.label}</span>
        <span className="text-[11px] text-text-3">
          weight {dim.weight}
          {dim.status === 'no_data' ? ' · no data' : ` · ${pct}%`}
        </span>
      </div>
      <div className="mt-1.5">
        <Progress value={pct} variant={variant} />
      </div>
      {dim.status === 'overlap' ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {dim.sharedCodes.map((code) => (
            <Badge key={code} variant="success">
              {labelForCode(dim.key, code)}
            </Badge>
          ))}
        </div>
      ) : dim.status === 'no_overlap' ? (
        <p className="mt-1 text-[11px] text-text-3">
          Student looked for{' '}
          {dim.menteeCodes
            .map((c) => labelForCode(dim.key, c))
            .join(', ')}
          {' '}— no shared match.
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-text-3">
          Student didn&rsquo;t answer this — excluded from the score.
        </p>
      )}
    </div>
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
