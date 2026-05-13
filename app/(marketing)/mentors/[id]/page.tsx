import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Lock, Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { PublicMentor } from '@/lib/types/mentor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 60

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

export default async function MentorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('public_mentor_profiles')
    .select('*')
    .eq('id', params.id)
    .single<PublicMentor>()

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

                {mentor.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mentor.tags.map((tag) => (
                      <Badge key={tag} variant="purple">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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

            <div className="mt-8 rounded-[var(--radius)] border border-primary-light bg-primary-soft p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-white">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text">
                      Want to work with {mentor.display_name.split(' ')[0]}?
                    </p>
                    <p className="text-[13px] text-text-2">
                      Sign up free to get matched with a mentor like this.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Get started free</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[12px] text-text-3">
          Pupil mentor profiles show partial info publicly. Full availability
          and direct booking unlock after sign in.
        </p>
      </div>
    </section>
  )
}
