"use client"

import { Star } from "lucide-react"
import { MENTORS } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-yellow-400 text-yellow-400"
              : i === full && hasHalf
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

export default function MentorsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mentors</h1>
          <p className="mt-1 text-sm text-gray-500">142 active &middot; 8 in onboarding</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MENTORS.map((mentor) => (
            <Card key={mentor.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar src={mentor.photo} alt={mentor.name} size="lg" />
                    {mentor.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{mentor.name}</h3>
                    <p className="text-xs text-gray-500">{mentor.university}</p>
                    <div className="mt-1.5">
                      <StarRating rating={mentor.rating} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{mentor.activeMentees}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Active mentees</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{mentor.sessions}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{mentor.rating}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
