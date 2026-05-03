'use client'

import Link from 'next/link'
import { STUDENT, MENTORS } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Stars from '@/components/stars'
import StatCard from '@/components/stat-card'
import { ArrowLeft, Star, Users, Calendar } from 'lucide-react'

export default function MentorProfilePage() {
  const mentor = MENTORS.find((m) => m.id === STUDENT.matchedMentor)

  if (!mentor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No mentor assigned yet.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left column: photo + actions */}
          <div className="space-y-5 lg:col-span-2">
            <img
              src={mentor.photo}
              alt={mentor.name}
              className="h-80 w-full rounded-xl object-cover"
              style={{ maxWidth: 320 }}
            />
            <div className="flex gap-3">
              <Button className="flex-1" asChild>
                <Link href="/dashboard/book">Book a session</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/messages">Message</Link>
              </Button>
            </div>
          </div>

          {/* Right column: details */}
          <div className="space-y-6 lg:col-span-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>
              <p className="mt-1 text-gray-500">
                {mentor.university} &middot; {mentor.major} &middot;{' '}
                {mentor.gradYear}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Bio */}
            <p className="leading-relaxed text-gray-600">{mentor.bio}</p>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Avg rating"
                value={mentor.rating.toFixed(1)}
                icon={<Star className="h-5 w-5" />}
              />
              <StatCard
                label="Total sessions"
                value={mentor.sessions}
                icon={<Calendar className="h-5 w-5" />}
              />
              <StatCard
                label="Active mentees"
                value={mentor.activeMentees}
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
