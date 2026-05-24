import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Sparkles, Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { PublicMentor } from '@/lib/types/mentor'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MENTOR_SPECIALTIES_SET } from '@/lib/constants'
import { getStudentMatchRequestQuota } from '@/lib/matching/request-quota'

import RequestMatchButton from './request-match-button'

// Auth-aware state is per-request, so don't cache the rendered page.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data } = await supabase
    .from('public_mentor_profiles')
    .select('display_name, university, major')
    .eq('id', params.id)
    .single<Pick<PublicMentor, 'display_name' | 'university' | 'major'>>()

  if (!data) {
    return { title: 'Mentor | Pupil' }
  }

  return {
    title: `${data.display_name} - ${data.university} | Pupil Mentors`,
    description: `Meet ${data.display_name}, a Pupil mentor at ${data.university}${data.major ? ` studying ${data.major}` : ''}.`,
  }
}

type ViewerState =
  | { kind: 'guest' }
  | {
      kind: 'student'
      alreadyRequested: boolean
      requestsRemaining: number
      requestsMax: number
      atCap: boolean
    }
  | { kind: 'mentor' }
  | { kind: 'admin' }

async function loadViewerState(
  supabase: ReturnType<typeof createClient>,
  mentorId: string
): Promise<ViewerState> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { kind: 'guest' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()

  if (!profile) return { kind: 'guest' }
  if (profile.role === 'mentor') return { kind: 'mentor' }
  if (profile.role === 'admin') return { kind: 'admin' }

  const [{ data: existingRequest }, quota] = await Promise.all([
    supabase
      .from('match_requests')
      .select('id')
      .eq('student_id', user.id)
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'forwarded', 'accepted'])
      .maybeSingle<{ id: string }>(),
    getStudentMatchRequestQuota(user.id),
  ])

  return {
    kind: 'student',
    alreadyRequested: !!existingRequest,
    requestsRemaining: quota.remaining,
    requestsMax: quota.max,
    atCap: quota.atCap,
  }
}

export default async function MentorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const [{ data, error }, viewer] = await Promise.all([
    supabase
      .from('public_mentor_profiles')
      .select('*')
      .eq('id', params.id)
      .single<PublicMentor>(),
    loadViewerState(supabase, params.id),
  ])

  if (error || !data) {
    notFound()
  }

  const mentor = data

  return (
    <section className="py-14">
      <div className="mx-auto max-w-3xl px-6">
        <Link
          href="/mentors"
          className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All mentors
        </Link>

        <Card className="overflow-hidden">
          <div className="relative h-40 w-full bg-gradient-to-br from-primary-soft to-primary-light" />

          <CardContent className="-mt-16 p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              {mentor.photo_url ? (
                <Image
                  src={mentor.photo_url}
                  alt={mentor.display_name}
                  width={140}
                  height={140}
                  className="h-32 w-32 rounded-[var(--radius-lg)] border-4 border-surface object-cover shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-[var(--radius-lg)] border-4 border-surface bg-primary-light text-[28px] font-semibold text-primary shadow-lg">
                  {mentor.display_name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="flex-1 sm:pt-16">
                <h1 className="display text-[28px] leading-tight">
                  {mentor.display_name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[14px] text-text-2">
                  <GraduationCap className="h-4 w-4" />
                  {mentor.university}
                  {mentor.major && (
                    <>
                      <span className="text-text-3">·</span>
                      <span>{mentor.major}</span>
                    </>
                  )}
                  {mentor.grad_year && (
                    <>
                      <span className="text-text-3">·</span>
                      <span>Class of &apos;{String(mentor.grad_year).slice(2)}</span>
                    </>
                  )}
                </p>

                <div className="mt-4 flex items-center gap-4 text-[13px]">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-semibold text-text">
                      {Number(mentor.rating).toFixed(1)}
                    </span>
                    <span className="text-text-2">rating</span>
                  </div>
                  <span className="text-border-strong">|</span>
                  <span className="text-text-2">
                    <span className="font-semibold text-text">
                      {mentor.sessions_count}
                    </span>{' '}
                    sessions delivered
                  </span>
                </div>

                {(() => {
                  const cleanTags =
                    mentor.tags?.filter((t) =>
                      MENTOR_SPECIALTIES_SET.has(t)
                    ) ?? []
                  if (cleanTags.length === 0) return null
                  return (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cleanTags.map((tag) => (
                        <Badge key={tag} variant="purple">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )
                })()}

                {mentor.is_ghost && (
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-bg-2 px-2.5 py-1 text-[11px] font-medium text-text-2 border border-border">
                    <Sparkles className="h-3 w-3" />
                    Onboarding in progress
                  </p>
                )}
              </div>
            </div>

            {mentor.bio && (
              <div className="mt-8 border-t border-border pt-8">
                <p className="tiny mb-3">About</p>
                <p className="text-[15px] leading-relaxed text-text">
                  {mentor.bio}
                </p>
              </div>
            )}

            <RequestMatchButton
              mentorId={mentor.id}
              mentorDisplayName={mentor.display_name}
              mentorIsGhost={mentor.is_ghost}
              viewer={viewer}
            />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[12px] text-text-3">
          Pupil mentor profiles show partial info publicly. Full availability
          and direct booking unlock after match.
        </p>
      </div>
    </section>
  )
}
