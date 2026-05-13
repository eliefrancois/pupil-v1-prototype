import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { getStudentProfile } from '@/lib/supabase/queries'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/profile')

  const profile = await getStudentProfile(user.id)

  const identity = (profile?.identity_json ?? {}) as {
    ethnicity?: string
    first_gen?: boolean
  }

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

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="display text-[28px] leading-tight">Your profile</h1>
            <p className="mt-1 text-[14px] text-text-2">
              What we use to match you with the right mentor.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/onboarding">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>

        {!profile ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <p className="text-[15px] font-semibold text-text">
                No profile yet
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                Finish onboarding so we can match you with a mentor.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/onboarding">Complete onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileRow label="Name" value={user.full_name || '—'} />
                <ProfileRow label="Email" value={user.email} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basics</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileRow
                  label="Grade"
                  value={profile.grade ? `${profile.grade}th` : '—'}
                />
                <ProfileRow label="GPA range" value={profile.gpa || '—'} />
                <ProfileRow
                  label="Location"
                  value={
                    [profile.city, profile.state].filter(Boolean).join(', ') ||
                    '—'
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TagSection label="Academic" items={profile.interests} />
                <TagSection label="Careers" items={profile.careers} />
                <TagSection label="Dream schools" items={profile.colleges} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Background</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileRow
                  label="Ethnic background"
                  value={identity.ethnicity || 'Prefer not to say'}
                />
                <ProfileRow
                  label="First-generation college student"
                  value={
                    identity.first_gen === undefined
                      ? 'Prefer not to say'
                      : identity.first_gen
                        ? 'Yes'
                        : 'No'
                  }
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-text-2">{label}</span>
      <span className="text-[14px] font-medium text-text">{value}</span>
    </div>
  )
}

function TagSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="tiny mb-2">{label}</p>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="purple">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-text-3">None added</p>
      )}
    </div>
  )
}
