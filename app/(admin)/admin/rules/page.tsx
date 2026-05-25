"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { SAFETY_RULES } from "@/lib/mock-data"
import type { SafetyRule } from "@/lib/mock-data"
import AdminDevNotice from "@/components/admin-dev-notice"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"

interface RuleState extends SafetyRule {
  saved: boolean
}

export default function RulesPage() {
  const [rules, setRules] = useState<RuleState[]>(
    SAFETY_RULES.map((r) => ({ ...r, saved: false }))
  )

  const updateConfig = (id: string, config: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, config, saved: false } : r))
    )
  }

  const toggleActive = (id: string, active: boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active, saved: false } : r))
    )
  }

  const saveRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, saved: true } : r))
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Safety rules</h1>
          <p className="mt-1 text-sm text-gray-500">
            Changes take immediate effect across the platform
          </p>
        </div>

        <AdminDevNotice feature="Safety rules" />

        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex items-start gap-6 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{rule.name}</h3>
                    <Badge variant={rule.active ? "success" : "secondary"}>
                      {rule.active ? "Active" : "Inactive"}
                    </Badge>
                    {rule.saved && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Save className="h-3 w-3" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      value={rule.config}
                      onChange={(e) => updateConfig(rule.id, e.target.value)}
                      className="max-w-sm font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => saveRule(rule.id)}
                      className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="shrink-0 pt-1">
                  <Toggle
                    checked={rule.active}
                    onCheckedChange={(checked) => toggleActive(rule.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
