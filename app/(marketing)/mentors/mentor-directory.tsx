'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Star, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { PublicMentor } from '@/lib/types/mentor'

interface MentorDirectoryProps {
  mentors: PublicMentor[]
}

export default function MentorDirectory({ mentors }: MentorDirectoryProps) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    mentors.forEach((m) => m.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [mentors])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mentors.filter((m) => {
      const matchesSearch =
        !q ||
        m.display_name.toLowerCase().includes(q) ||
        m.university.toLowerCase().includes(q) ||
        m.major?.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.toLowerCase().includes(q))
      const matchesTag = !activeTag || m.tags?.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [mentors, search, activeTag])

  return (
    <>
      <section className="border-b border-border bg-surface py-14">
        <div className="mx-auto max-w-page px-6">
          <p className="tiny text-primary">Meet the mentors</p>
          <h1 className="display mt-3 text-[36px] sm:text-[44px]">
            Real students at top universities,{' '}
            <em className="italic font-normal">ready to guide you.</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] text-text-2">
            Every Pupil mentor is a current college student or recent grad who
            went through the process recently. Browse profiles and find someone
            whose path looks like yours.
          </p>

          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
              <Input
                placeholder="Search by name, school, major, or interest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search mentors"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  activeTag === null
                    ? 'bg-primary text-white'
                    : 'border border-border text-text-2 hover:border-primary hover:text-primary'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-primary text-white'
                      : 'border border-border text-text-2 hover:border-primary hover:text-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-page px-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[13px] text-text-2">
              {filtered.length} {filtered.length === 1 ? 'mentor' : 'mentors'}
            </p>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-8 w-8 text-text-3" />
              <p className="mt-3 text-[15px] font-medium text-text">
                No mentors match that search
              </p>
              <p className="mt-1 text-[13px] text-text-2">
                Try a different keyword or clear your filters.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((mentor) => (
                <Link key={mentor.id} href={`/mentors/${mentor.id}`}>
                  <Card hover className="h-full p-5">
                    <CardContent className="p-0">
                      {mentor.photo_url && (
                        <Image
                          src={mentor.photo_url}
                          alt={mentor.display_name}
                          width={400}
                          height={400}
                          className="h-44 w-full rounded-[var(--radius-sm)] object-cover"
                        />
                      )}
                      <h3 className="mt-4 text-[15px] font-semibold text-text">
                        {mentor.display_name}
                      </h3>
                      <p className="text-[13px] text-text-2">
                        {mentor.university}
                      </p>
                      {mentor.major && (
                        <p className="text-[12px] text-text-3">
                          {mentor.major}
                          {mentor.grad_year && ` · Class of '${String(mentor.grad_year).slice(2)}`}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-[13px]">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span className="font-medium text-text">
                            {Number(mentor.rating).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-text-3">|</span>
                        <span className="text-text-2">
                          {mentor.sessions_count} sessions
                        </span>
                      </div>
                      {mentor.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {mentor.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="purple">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-surface-2 py-16">
        <div className="mx-auto max-w-page px-6">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-8 sm:p-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="tiny text-primary">For college students</p>
                <h2 className="display mt-2 text-[26px] sm:text-[30px]">
                  Want to mentor on Pupil?
                </h2>
                <p className="mt-3 text-[14px] text-text-2">
                  We&apos;re onboarding mentors at top universities. If
                  you&apos;ve been through the college process recently and
                  want to help a high schooler navigate it, we&apos;d love to
                  hear from you. Applications take about 5 minutes and we
                  review within a few business days.
                </p>
              </div>
              <Link
                href="/mentor-signup"
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Apply to mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
