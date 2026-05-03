'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MENTORS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Lock } from 'lucide-react'

const MENTOR = MENTORS.find((m) => m.id === 'm_amara')!

export default function MentorSettingsPage() {
  const [name, setName] = useState(MENTOR.name)
  const [email, setEmail] = useState('amara.okafor@stanford.edu')
  const [bio, setBio] = useState(MENTOR.bio)
  const [university, setUniversity] = useState(MENTOR.university)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile, availability, and account
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="university"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  University
                </label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Bio
                </label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Availability card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-500">
                Manage your weekly availability and calendar connection.
              </p>
              <Button variant="outline" asChild>
                <Link href="/mentor/schedule">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Edit schedule
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-500">
                Security and account management.
              </p>
              <Button variant="outline">
                <Lock className="mr-1.5 h-4 w-4" />
                Change password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
