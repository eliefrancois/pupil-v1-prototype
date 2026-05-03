'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectOption } from '@/components/ui/select'
import { Calendar, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------- Constants ---------- */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLOCKS = [
  { label: 'Morning', range: '9 am - 12 pm' },
  { label: 'Afternoon', range: '12 - 5 pm' },
  { label: 'Evening', range: '5 - 9 pm' },
]

const INITIAL_AVAILABILITY: Record<string, boolean> = {
  'Mon-Evening': true,
  'Tue-Afternoon': true,
  'Tue-Evening': true,
  'Wed-Evening': true,
  'Thu-Afternoon': true,
  'Thu-Evening': true,
  'Sat-Morning': true,
  'Sun-Afternoon': true,
}

const BUFFER_OPTIONS = ['10', '15', '30']
const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/New_York', label: 'Eastern' },
]

/* ---------- Page ---------- */

export default function SchedulePage() {
  const [calendarConnected, setCalendarConnected] = useState(true)
  const [availability, setAvailability] = useState<Record<string, boolean>>(
    INITIAL_AVAILABILITY
  )
  const [buffer, setBuffer] = useState('15')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  function toggleCell(day: string, block: string) {
    const key = `${day}-${block}`
    setAvailability((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Schedule &amp; availability
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sessions are auto-blocked from your connected calendar.
          </p>
        </div>

        {/* Calendar connection */}
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {calendarConnected
                    ? 'Google Calendar connected'
                    : 'No calendar connected'}
                </p>
                {calendarConnected && (
                  <p className="text-xs text-gray-500">
                    amara.okafor@stanford.edu
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={calendarConnected ? 'outline' : 'default'}
              size="sm"
              onClick={() => setCalendarConnected(!calendarConnected)}
            >
              {calendarConnected ? (
                <>
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  Disconnect
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Availability editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-28 p-2 text-left text-xs font-medium text-gray-500" />
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="p-2 text-center text-xs font-semibold text-gray-700"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLOCKS.map((block) => (
                    <tr key={block.label}>
                      <td className="p-2">
                        <p className="text-sm font-medium text-gray-700">
                          {block.label}
                        </p>
                        <p className="text-xs text-gray-400">{block.range}</p>
                      </td>
                      {DAYS.map((day) => {
                        const key = `${day}-${block.label}`
                        const isActive = !!availability[key]

                        return (
                          <td key={key} className="p-1.5">
                            <button
                              type="button"
                              onClick={() => toggleCell(day, block.label)}
                              className={cn(
                                'h-12 w-full rounded-md border-2 transition-colors',
                                isActive
                                  ? 'border-[#7A60E4] bg-[#7A60E4]/10'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              )}
                              aria-label={`${day} ${block.label} ${isActive ? 'available' : 'unavailable'}`}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Settings row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <label
                htmlFor="buffer"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Buffer between sessions
              </label>
              <Select
                id="buffer"
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
              >
                {BUFFER_OPTIONS.map((opt) => (
                  <SelectOption key={opt} value={opt}>
                    {opt} minutes
                  </SelectOption>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <label
                htmlFor="timezone"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Timezone
              </label>
              <Select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectOption key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectOption>
                ))}
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button size="lg">Save changes</Button>
        </div>
      </div>
    </div>
  )
}
