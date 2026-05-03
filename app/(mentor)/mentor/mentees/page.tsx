'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { MessageCircle, ArrowRight } from 'lucide-react'

/* ---------- Mock mentees ---------- */

interface Mentee {
  id: string
  name: string
  grade: number
  school: string
  photo: string | null
  interests: string[]
  sessionCount: number
  lastSessionDaysAgo: number | null
}

const MENTEES: Mentee[] = [
  {
    id: 'me_1',
    name: 'Riley Park',
    grade: 11,
    school: 'West Mesa HS',
    photo: null,
    interests: ['CS', 'Cogsci'],
    sessionCount: 3,
    lastSessionDaysAgo: 7,
  },
  {
    id: 'me_2',
    name: 'Jordan Tate',
    grade: 12,
    school: 'Roosevelt HS',
    photo: null,
    interests: ['Pre-med', 'Bio'],
    sessionCount: 1,
    lastSessionDaysAgo: 14,
  },
  {
    id: 'me_3',
    name: 'Marcus Bell',
    grade: 11,
    school: 'Garfield HS',
    photo: null,
    interests: ['Engineering', 'Robotics'],
    sessionCount: 4,
    lastSessionDaysAgo: 3,
  },
  {
    id: 'me_4',
    name: 'Sofia Reyes',
    grade: 11,
    school: 'Garfield HS Chicago',
    photo: null,
    interests: ['Public policy', 'Econ'],
    sessionCount: 2,
    lastSessionDaysAgo: 10,
  },
  {
    id: 'me_5',
    name: 'Theo Bennett',
    grade: 10,
    school: 'Lakeside School',
    photo: null,
    interests: ['Writing'],
    sessionCount: 1,
    lastSessionDaysAgo: 21,
  },
  {
    id: 'me_6',
    name: 'Anya Petrov',
    grade: 10,
    school: 'Central HS',
    photo: null,
    interests: ['Math', 'Physics'],
    sessionCount: 6,
    lastSessionDaysAgo: 2,
  },
]

/* ---------- Helpers ---------- */

function relativeDate(daysAgo: number | null): string {
  if (daysAgo === null) return 'No sessions yet'
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return `${daysAgo} days ago`
  if (daysAgo < 14) return '1 week ago'
  return `${Math.floor(daysAgo / 7)} weeks ago`
}

/* ---------- Page ---------- */

export default function MenteesPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My mentees</h1>
          <p className="mt-1 text-sm text-gray-500">
            6 active students this term
          </p>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {MENTEES.map((mentee) => (
            <Card key={mentee.id}>
              <CardContent className="space-y-4 p-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Avatar alt={mentee.name} src={mentee.photo} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {mentee.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Grade {mentee.grade} &middot; {mentee.school}
                    </p>
                  </div>
                </div>

                {/* Interest tags */}
                <div className="flex flex-wrap gap-1.5">
                  {mentee.interests.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {mentee.sessionCount} session{mentee.sessionCount !== 1 ? 's' : ''}
                  </span>
                  <span>Last: {relativeDate(mentee.lastSessionDaysAgo)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/mentor/messages">
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      Message
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/history">
                      History
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
