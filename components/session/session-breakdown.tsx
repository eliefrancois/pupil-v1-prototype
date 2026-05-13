import Link from 'next/link'
import { ArrowLeft, Video, FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { RatingCard } from '@/components/session/rating-card'
import type { SessionForReview } from '@/lib/supabase/queries'

interface SessionBreakdownProps {
  review: SessionForReview
  recordingLink: string | null
  transcriptText: string | null
  backHref: string
}

/**
 * Post-call breakdown page body. Server component — the only interactive
 * piece is the rating widget (which is its own client island).
 *
 * AI-derived sections (topics, action items, next focus, mentioned entities)
 * are intentionally omitted for V0. The `post_call_breakdowns` table is in
 * place to receive them when we wire the analysis pipeline.
 */
export function SessionBreakdown({
  review,
  recordingLink,
  transcriptText,
  backHref,
}: SessionBreakdownProps) {
  const { booking, counterpart, viewerRole, existingRating } = review

  const start = booking.started_at
    ? new Date(booking.started_at)
    : new Date(booking.starts_at)
  const dateLabel = start.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  // Prefer the actual measured duration from the meeting.ended webhook;
  // fall back to the scheduled duration if the call was very short or the
  // webhook hasn't landed yet.
  const durationLabel = booking.duration_seconds
    ? formatDuration(booking.duration_seconds)
    : `${booking.duration ?? 30} min (scheduled)`

  const recordingReady = Boolean(booking.recording_url && recordingLink)
  // Three distinct transcript states:
  //   - `transcriptText === null`: not stored yet, or fetch/access-link failed
  //   - `transcriptText === ''`  : Daily produced an empty VTT (no speech)
  //   - non-empty                : real content to display
  const transcriptHasContent =
    typeof transcriptText === 'string' && transcriptText.length > 0
  const transcriptEmpty =
    typeof transcriptText === 'string' && transcriptText.length === 0
  const stillProcessing =
    booking.status === 'completed' &&
    (!booking.recording_url || !booking.transcript_url)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>

        <header className="flex items-start gap-4">
          <Avatar
            src={counterpart?.photo_url ?? undefined}
            alt={counterpart?.full_name ?? 'Counterpart'}
            size="lg"
          />
          <div className="flex-1">
            <h1 className="display text-[28px] leading-tight">
              Session with {counterpart?.full_name ?? 'your counterpart'}
            </h1>
            <p className="mt-1 text-sm text-text-2">
              {dateLabel} at {timeLabel} &middot; {durationLabel}
            </p>
            {counterpart?.university && viewerRole === 'student' ? (
              <p className="text-xs text-text-3">{counterpart.university}</p>
            ) : null}
          </div>
          <StatusBadge status={booking.status} />
        </header>

        {stillProcessing ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-4 text-sm text-text-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              Recording and transcript usually finish processing within a
              minute or two after the call ends. Refresh to check.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-4 w-4 text-primary" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recordingReady && recordingLink ? (
                  <video
                    controls
                    src={recordingLink}
                    className="w-full rounded-md bg-black"
                  />
                ) : (
                  <p className="py-6 text-center text-sm text-text-3">
                    {booking.recording_url
                      ? 'Could not load the recording link. Refresh to try again.'
                      : 'Recording is still being prepared.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transcriptHasContent ? (
                  <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-2 p-4 font-sans text-[13px] leading-relaxed text-text">
                    {transcriptText}
                  </pre>
                ) : transcriptEmpty ? (
                  <p className="py-6 text-center text-sm text-text-3">
                    No speech was captured during this session.
                  </p>
                ) : (
                  <p className="py-6 text-center text-sm text-text-3">
                    {booking.transcript_url
                      ? 'Could not load the transcript. Refresh to try again.'
                      : 'Transcript is still being prepared.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {viewerRole === 'student' ? (
              <RatingCard
                bookingId={booking.id}
                initialScore={existingRating}
              />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="Date" value={dateLabel} />
                <DetailRow label="Time" value={timeLabel} />
                <DetailRow label="Duration" value={durationLabel} />
                <DetailRow
                  label={viewerRole === 'student' ? 'Mentor' : 'Student'}
                  value={counterpart?.full_name ?? 'Unknown'}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="success">Completed</Badge>
  if (status === 'no_show') return <Badge variant="warning">No show</Badge>
  if (status === 'cancelled') return <Badge variant="danger">Cancelled</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-text-3">{label}</span>
      <span className="text-right text-text">{value}</span>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m} min` : `${m} min ${s}s`
}
