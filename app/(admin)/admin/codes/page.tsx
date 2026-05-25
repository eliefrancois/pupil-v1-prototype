"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { ACCESS_CODES } from "@/lib/mock-data"
import type { AccessCode } from "@/lib/mock-data"
import AdminDevNotice from "@/components/admin-dev-notice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const statusBadge: Record<AccessCode["status"], "success" | "warning" | "secondary"> = {
  active: "success",
  depleted: "warning",
  expired: "secondary",
}

function generateCode(school: string): string {
  const slug = school
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .slice(0, 2)
    .join("-")
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${slug}-${rand}`
}

export default function CodesPage() {
  const [codes, setCodes] = useState<AccessCode[]>([...ACCESS_CODES])
  const [school, setSchool] = useState("")
  const [quantity, setQuantity] = useState("")
  const [sessions, setSessions] = useState("6")
  const [expiry, setExpiry] = useState("")

  const handleGenerate = () => {
    if (!school || !quantity || !expiry) return
    const newCode: AccessCode = {
      code: generateCode(school),
      school,
      redeemed: 0,
      total: parseInt(quantity, 10),
      expires: expiry,
      status: "active",
    }
    setCodes((prev) => [newCode, ...prev])
    setSchool("")
    setQuantity("")
    setSessions("6")
    setExpiry("")
  }

  const handleDeactivate = (code: string) => {
    setCodes((prev) =>
      prev.map((c) =>
        c.code === code ? { ...c, status: "expired" as const } : c
      )
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Access codes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and manage bulk access codes for schools and partners
          </p>
        </div>

        <AdminDevNotice feature="Access codes" />

        {/* Generate section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Generate new codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  School name
                </label>
                <Input
                  placeholder="e.g. Lincoln High School"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                />
              </div>
              <div className="w-28">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Quantity
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Sessions per code
                </label>
                <Select value={sessions} onChange={(e) => setSessions(e.target.value)}>
                  <SelectOption value="6">6 sessions</SelectOption>
                  <SelectOption value="8">8 sessions</SelectOption>
                  <SelectOption value="10">10 sessions</SelectOption>
                  <SelectOption value="12">12 sessions</SelectOption>
                </Select>
              </div>
              <div className="w-44">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Expiry date
                </label>
                <Input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Codes table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">School</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Usage</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Expires</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((code) => (
                    <tr key={code.code} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{code.school}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Progress
                            value={code.redeemed}
                            max={code.total}
                            className="h-2 w-24"
                            variant={
                              code.redeemed === code.total
                                ? "warning"
                                : "default"
                            }
                          />
                          <span className="text-xs text-gray-500">
                            {code.redeemed}/{code.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{code.expires}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadge[code.status]}>
                          {code.status.charAt(0).toUpperCase() + code.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {code.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(code.code)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
