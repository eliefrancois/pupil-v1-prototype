'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Loader as Loader2,
  Mail,
  MapPin,
  Pencil,
  School,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { updateMentorReviewStatus } from '@/lib/actions/mentor-review-actions'
import { MIN_MENTOR_MATCH_SLOTS } from '@/lib/matching/mentor-eligibility'
import { labelsForCodes, labelForCode } from '@/lib/identity-taxonomy'

import MentorEditDialog from './mentor-edit-dialog'
import type { MentorReviewItem } from './types'

// Resolve a dimension's stored value (codes, or legacy label strings) into a
// human-readable, comma-joined string for the admin detail view. Falls back to
// a legacy identity_json key when the new code-based key is absent.
function readDim(
  identity: Record<string, unknown> | null | undefined,
  dimensionKey: string,
  legacyKey?: string
): string {
  if (!identity) return ''
  const raw = identity[dimensionKey] ?? (legacyKey ? identity[legacyKey] : undefined)
  if (Array.isArray(raw)) {
    const codes = raw.filter((x): x is string => typeof x === 'string')
    if (codes.length === 0) return ''
    return labelsForCodes(dimensionKey, codes).join(', ')
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return labelForCode(dimensionKey, raw)
  }
  return ''
}

const TIME_WINDOW_LABELS: Record<string, string> = {
  weekday_morning: 'Weekday mornings',
  weekday_afternoon: 'Weekday afternoons',
  weekday_evening: 'Weekday evenings',
  weekend_morning: 'Weekend mornings',
  weekend_afternoon: 'Weekend afternoons',
  weekend_evening: 'Weekend evenings',
}

export default function MentorReviewRow({
  mentor,
}: {
  mentor: MentorReviewItem
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [editing, setEditing] = useState(false)

  const initials = (mentor.full_name || mentor.email)
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const updateStatus = async (
    newStatus: 'approved' | 'rejected' | 'paused' | 'pending',
    notes?: string
  ) => {
    setBusy(newStatus)
    setError('')
    try {
      const result = await updateMentorReviewStatus({
        mentorUserId: mentor.user_id,
        status: newStatus,
        reviewNotes: notes ?? mentor.review_notes,
        mentorEmail: mentor.email,
        mentorName: mentor.full_name,
        university: mentor.university,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setShowRejectInput(false)
      setRejectNotes('')
      router.refresh()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      )
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async () => {
    await updateStatus('rejected', rejectNotes.trim() || undefined)
  }

  const statusBadge = (() => {
    switch (mentor.status) {
      case 'pending':
        return <Badge variant="warning">Pending review</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>
    }
  })()

  const hasAvailability =
    mentor.availability_slot_count >= MIN_MENTOR_MATCH_SLOTS
  const availabilityBadge =
    mentor.status === 'approved' ? (
      hasAvailability ? (
        <Badge variant="success">
          {mentor.availability_slot_count} slot
          {mentor.availability_slot_count === 1 ? '' : 's'} set
        </Badge>
      ) : (
        <Badge variant="warning">No availability yet</Badge>
      )
    ) : null

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {mentor.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mentor.photo_url}
              alt={mentor.full_name}
              className="h-14 w-14 shrink-0 rounded-[var(--radius)] object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary-light text-[15px] font-semibold text-primary">
              {initials || '?'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-text">
                {mentor.full_name || '(no name)'}
              </p>
              {statusBadge}
              {availabilityBadge}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-text-2">
              <span>{mentor.email}</span>
              {mentor.linkedin_url && (
                <a
                  href={mentor.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              )}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-2">
              {mentor.university && (
                <span className="inline-flex items-center gap-1">
                  <School className="h-3.5 w-3.5 text-text-3" />
                  {mentor.university}
                </span>
              )}
              {mentor.year_in_school && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-text-3" />
                  {mentor.year_in_school}
                  {mentor.grad_year && ` (\u2018${String(mentor.grad_year).slice(2)})`}
                </span>
              )}
              {mentor.timezone && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-text-3" />
                  {mentor.timezone.replace(/_/g, ' ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-text-3" />
                Capacity {mentor.max_mentees}
              </span>
              {mentor.status === 'approved' && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    hasAvailability ? 'text-text-2' : 'text-warning'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-text-3" />
                  {hasAvailability
                    ? `${mentor.availability_slot_count} weekly slot${
                        mentor.availability_slot_count === 1 ? '' : 's'
                      } · assignable`
                    : 'Needs availability before matching'}
                </span>
              )}
            </div>

            {mentor.tags && mentor.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mentor.tags.map((t) => (
                  <Badge key={t} variant="purple">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {mentor.bio && (
              <p className="mt-3 text-[13px] leading-relaxed text-text-2">
                {expanded || mentor.bio.length <= 180
                  ? mentor.bio
                  : `${mentor.bio.slice(0, 180)}...`}
              </p>
            )}

            {expanded && (
              <div className="mt-4 space-y-3 rounded-[var(--radius-sm)] bg-surface-2 p-4 text-[13px] text-text-2">
                {mentor.major && (
                  <DetailRow label="Major" value={mentor.major} />
                )}
                {mentor.commitment && (
                  <DetailRow
                    label="Commitment"
                    value={
                      mentor.commitment === 'semester'
                        ? 'One semester'
                        : mentor.commitment === 'year'
                          ? 'Full academic year'
                          : 'Open-ended'
                    }
                  />
                )}
                {mentor.availability_schedule?.time_windows &&
                  mentor.availability_schedule.time_windows.length > 0 && (
                    <DetailRow
                      label="Availability"
                      value={mentor.availability_schedule.time_windows
                        .map((w) => TIME_WINDOW_LABELS[w] ?? w)
                        .join(', ')}
                    />
                  )}
                {readDim(mentor.identity_json, 'academic_identity') && (
                  <DetailRow
                    label="Academic identity"
                    value={readDim(mentor.identity_json, 'academic_identity')}
                  />
                )}
                {readDim(mentor.identity_json, 'gender_identity', 'gender') && (
                  <DetailRow
                    label="Gender"
                    value={readDim(mentor.identity_json, 'gender_identity', 'gender')}
                  />
                )}
                {readDim(mentor.identity_json, 'race_ethnicity', 'ethnicities') && (
                  <DetailRow
                    label="Race / ethnicity"
                    value={readDim(mentor.identity_json, 'race_ethnicity', 'ethnicities')}
                  />
                )}
                {readDim(mentor.identity_json, 'first_gen') && (
                  <DetailRow
                    label="First-gen"
                    value={readDim(mentor.identity_json, 'first_gen')}
                  />
                )}
                {readDim(mentor.identity_json, 'college_experience') && (
                  <DetailRow
                    label="College experience"
                    value={readDim(mentor.identity_json, 'college_experience')}
                  />
                )}
                {readDim(mentor.identity_json, 'career_aspirations') && (
                  <DetailRow
                    label="Career path"
                    value={readDim(mentor.identity_json, 'career_aspirations')}
                  />
                )}
                {readDim(mentor.identity_json, 'mentee_preferences') && (
                  <DetailRow
                    label="Wants to support"
                    value={readDim(mentor.identity_json, 'mentee_preferences')}
                  />
                )}
                {mentor.motivations && mentor.motivations.length > 0 && (
                  <DetailRow
                    label="Motivations"
                    value={mentor.motivations.join(', ')}
                  />
                )}
                {mentor.submitted_at && (
                  <DetailRow
                    label="Submitted"
                    value={new Date(mentor.submitted_at).toLocaleString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }
                    )}
                  />
                )}
                {mentor.reviewed_at && (
                  <DetailRow
                    label="Reviewed"
                    value={new Date(mentor.reviewed_at).toLocaleString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  />
                )}
                {mentor.review_notes && (
                  <DetailRow label="Notes" value={mentor.review_notes} />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpanded((s) => !s)}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-primary"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show full profile
                </>
              )}
            </button>
          </div>
        </div>

        {showRejectInput && (
          <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
            <label className="text-[12px] font-medium text-text-2">
              Reason (sent to mentor, optional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-2 py-1.5 text-[13px] text-text focus-visible:border-primary focus-visible:outline-none"
              placeholder="e.g. We need more details on your school affiliation."
            />
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectInput(false)
                  setRejectNotes('')
                }}
                disabled={busy === 'rejected'}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={busy === 'rejected'}
              >
                {busy === 'rejected' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Rejecting
                  </>
                ) : (
                  'Confirm rejection'
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-[12px] text-[#B91C1C]">{error}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {mentor.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => updateStatus('approved')}
                disabled={!!busy}
              >
                {busy === 'approved' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectInput((s) => !s)}
                disabled={!!busy}
              >
                Reject
              </Button>
            </>
          )}
          {mentor.status === 'approved' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus('paused')}
                disabled={!!busy}
              >
                {busy === 'paused' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Pause
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectInput((s) => !s)}
                disabled={!!busy}
                className="text-[#B91C1C] hover:bg-[rgba(239,68,68,0.06)]"
              >
                Remove
              </Button>
            </>
          )}
          {mentor.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => updateStatus('approved')}
              disabled={!!busy}
            >
              {busy === 'approved' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Reactivate
            </Button>
          )}
          {mentor.status === 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus('pending')}
              disabled={!!busy}
            >
              {busy === 'pending' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Move back to pending
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={!!busy}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-primary disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <a
              href={`mailto:${mentor.email}`}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </div>
        </div>
      </CardContent>

      {editing && (
        <MentorEditDialog
          mentor={mentor}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 shrink-0 text-[12px] font-medium text-text-3">
        {label}
      </span>
      <span className="text-[13px] text-text">{value}</span>
    </div>
  )
}
