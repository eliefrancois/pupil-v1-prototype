import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getSessionForReview } from '@/lib/supabase/queries'
import {
  getRecordingAccessLink,
  getTranscriptAccessLink,
  fetchTranscriptText,
} from '@/lib/daily/client'
import { SessionBreakdown } from '@/components/session/session-breakdown'

interface PageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export default async function MentorBreakdownPage({ params }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const review = await getSessionForReview(params.id, user.id)
  if (!review) notFound()
  if (review.viewerRole !== 'mentor') redirect(`/dashboard/session/${params.id}/breakdown`)
  if (review.booking.status === 'cancelled') notFound()

  const [recordingLink, transcriptLinkUrl] = await Promise.all([
    review.booking.recording_url
      ? getRecordingAccessLink(review.booking.recording_url)
      : Promise.resolve(null),
    review.booking.transcript_url
      ? getTranscriptAccessLink(review.booking.transcript_url)
      : Promise.resolve(null),
  ])

  const transcriptText = transcriptLinkUrl
    ? await fetchTranscriptText(transcriptLinkUrl)
    : null

  return (
    <SessionBreakdown
      review={review}
      recordingLink={recordingLink}
      transcriptText={transcriptText}
      backHref="/mentor/history"
    />
  )
}
