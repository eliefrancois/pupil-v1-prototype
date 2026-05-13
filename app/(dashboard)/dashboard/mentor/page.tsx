import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Calendar, Lock, Search, Star, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/stat-card'
import UpgradeBanner from '@/components/upgrade-banner'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getMatchedMentor, getStudentProfile } from '@/lib/supabase/queries'

export default async function MentorProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/mentor')

  const isPaid = user.subscription_status !== 'inactive'
  const profile = await getStudentProfile(user.id)
  const mentor = await getMatchedMentor(profile?.matched_mentor_id)

  if (!mentor) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>

          <Card className="bg-primary-soft border-primary-light">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary-light pulse-ring" />
                <Search className="relative h-7 w-7 text-primary" />
              </div>
              <h1 className="text-[20px] font-semibold text-text">
                No mentor assigned yet
              </h1>
              <p className="mt-2 max-w-md text-[14px] text-text-2">
                We&apos;re reviewing your interests, goals, and background to
                pair you with the right mentor. While you wait, browse the
                directory.
              </p>
              <Button variant="secondary" className="mt-6" asChild>
                <Link href="/mentors">Browse mentors</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-2 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        {!isPaid && <UpgradeBanner />}

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            {mentor.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mentor.photo_url}
                alt={mentor.full_name}
                className="h-80 w-full rounded-[var(--radius-lg)] object-cover"
                style={{ maxWidth: 320 }}
              />
            )}
            <div className="flex gap-3">
              {isPaid ? (
                <>
                  <Button className="flex-1" asChild>
                    <Link href="/dashboard/book">Book a session</Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/dashboard/messages">Message</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" asChild>
                    <Link href="/pricing">
                      <Lock className="h-4 w-4" />
                      Upgrade to book
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/pricing">
                      <Lock className="h-4 w-4" />
                      Upgrade to message
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div>
              <h1 className="display text-[32px] leading-tight">
                {mentor.full_name}
              </h1>
              <p className="mt-1 text-[14px] text-text-2">
                {mentor.university}
                {mentor.major && ` · ${mentor.major}`}
                {mentor.grad_year &&
                  ` · Class of '${String(mentor.grad_year).slice(2)}`}
              </p>
            </div>

            {mentor.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mentor.tags.map((tag) => (
                  <Badge key={tag} variant="purple">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {mentor.bio && (
              <p className="text-[15px] leading-relaxed text-text-2">
                {mentor.bio}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Avg rating"
                value={Number(mentor.rating).toFixed(1)}
                icon={<Star className="h-5 w-5" />}
              />
              <StatCard
                label="Total sessions"
                value={mentor.sessions_count}
                icon={<Calendar className="h-5 w-5" />}
              />
              <StatCard
                label="Active mentees"
                value="—"
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
