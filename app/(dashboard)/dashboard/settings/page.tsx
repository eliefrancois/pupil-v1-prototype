'use client'

import { useState } from 'react'
import { STUDENT } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectOption } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
]

export default function SettingsPage() {
  const [email, setEmail] = useState(`${STUDENT.firstName.toLowerCase()}.${STUDENT.lastName.toLowerCase()}@example.com`)
  const [phone, setPhone] = useState('(505) 555-0142')
  const [timezone, setTimezone] = useState('America/Denver')

  const [sessionReminders, setSessionReminders] = useState(true)
  const [messageNotifs, setMessageNotifs] = useState(true)
  const [breakdownNotifs, setBreakdownNotifs] = useState(true)
  const [marketingNotifs, setMarketingNotifs] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Account, notifications, and privacy
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
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
                  {TIMEZONES.map((tz) => (
                    <SelectOption key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <NotificationRow
                label="Session reminders"
                description="Get notified before your sessions start"
                checked={sessionReminders}
                onChange={setSessionReminders}
              />
              <NotificationRow
                label="Messages"
                description="Get notified when your mentor sends a message"
                checked={messageNotifs}
                onChange={setMessageNotifs}
              />
              <NotificationRow
                label="Session breakdowns"
                description="Get notified when a session breakdown is ready"
                checked={breakdownNotifs}
                onChange={setBreakdownNotifs}
              />
              <NotificationRow
                label="Marketing"
                description="Tips, product updates, and promotions"
                checked={marketingNotifs}
                onChange={setMarketingNotifs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function NotificationRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
