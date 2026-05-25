"use client"

import { useState } from "react"
import { CircleCheck as CheckCircle, Circle as XCircle, Mail } from "lucide-react"
import { ELIGIBILITY } from "@/lib/mock-data"
import type { EligibilityApplication } from "@/lib/mock-data"
import AdminDevNotice from "@/components/admin-dev-notice"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function EligibilityPage() {
  const [applications, setApplications] = useState<EligibilityApplication[]>([
    ...ELIGIBILITY,
  ])
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = (id: string, name: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id))
    showToast(`${name} approved`)
  }

  const handleDeny = (id: string, name: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id))
    showToast(`${name} denied`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Eligibility review</h1>
          <p className="mt-1 text-sm text-gray-500">
            {applications.length} application{applications.length !== 1 ? "s" : ""} pending review
          </p>
        </div>

        <AdminDevNotice feature="Eligibility review" />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-lg">
            {toast}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No pending applications.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                      <span className="text-xs text-gray-500">Grade {app.grade}</span>
                      <span className="text-xs text-gray-400">{app.school}</span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      {app.email}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="default">{app.type}</Badge>
                      <Badge
                        variant={
                          app.counselorStatus === "confirmed" ? "success" : "warning"
                        }
                      >
                        Counselor {app.counselorStatus}
                      </Badge>
                      <span className="text-xs text-gray-400">{app.counselor}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      className="gap-1.5"
                      disabled={app.counselorStatus !== "confirmed"}
                      onClick={() => handleApprove(app.id, app.name)}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => handleDeny(app.id, app.name)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
